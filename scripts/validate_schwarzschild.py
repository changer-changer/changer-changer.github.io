"""Basic regression checks for the Schwarzschild integrators (G=c=M=1)."""
import math
import numpy as np

def captured(b, dt):
    p=np.array([b,-100.,0.]); v=np.array([0.,1.,0.])
    angular=np.cross(p,v); l2=np.dot(angular,angular)
    def acceleration(x): return -3*l2*x/(np.dot(x,x)**2.5)
    for _ in range(int(260/dt)):
        p1=v;v1=acceleration(p)
        p2=v+dt*v1/2;v2=acceleration(p+dt*p1/2)
        p3=v+dt*v2/2;v3=acceleration(p+dt*p2/2)
        p4=v+dt*v3;v4=acceleration(p+dt*p3)
        p+=dt*(p1+2*p2+2*p3+p4)/6;v+=dt*(v1+2*v2+2*v3+v4)/6
        r=np.linalg.norm(p)
        if r<2.04:return True
        if r>101 and np.dot(p,v)>0:return False
    raise AssertionError('Ray did not terminate')

# A distant observer sees the critical impact parameter 3*sqrt(3)*M.
for dt in (.26,.13):
    assert captured(5.10,dt)
    assert not captured(5.30,dt)
print('Photon capture check passed on both step sizes; b_critical =',3*math.sqrt(3))

# Check the energy first integral along an inward timelike geodesic, as used in JS.
r=10.; L=r/math.sqrt(r-3)*.98; vr=-.008
def energy2(r,vr): return vr*vr+(1-2/r)*(1+L*L/(r*r))
e0=energy2(r,vr); h=.02; maxerr=0
for _ in range(20000):
    def acc(x):return -1/x**2+L**2/x**3-3*L**2/x**4
    vr+=acc(r)*h*.5;r+=vr*h;vr+=acc(r)*h*.5
    maxerr=max(maxerr,abs(energy2(r,vr)-e0))
    if r<6.01:break
assert maxerr<1e-6,(r,maxerr)
print('Timelike energy drift:',maxerr,'final radius:',r)
