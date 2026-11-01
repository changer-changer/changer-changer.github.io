import numpy as np
from PIL import Image
W,H=480,270
M=1.0
cam=np.array([0.,-35.,18.]); forward=-cam/np.linalg.norm(cam); right=np.array([1.,0.,0.]); up=np.cross(right,forward);up/=np.linalg.norm(up)
x=np.linspace(-22,22,W); y=np.linspace(15,-15,H); X,Y=np.meshgrid(x,y)
pos=cam+X[...,None]*right+Y[...,None]*up
pos=pos.reshape(-1,3); direction=np.broadcast_to(forward,pos.shape).copy(); L2=np.sum(np.cross(pos,direction)**2,axis=1)
active=np.ones(len(pos),dtype=bool); hit=np.zeros(len(pos),dtype=bool); hx=np.zeros(len(pos));hy=hx.copy(); hz=hx.copy()
def acc(p,l):
 r2=np.maximum(np.sum(p*p,axis=1),1.)
 return (-3*M*l/(r2*r2*np.sqrt(r2)))[:,None]*p
# Integrate null trajectories in Schwarzschild coordinates. RK4 in affine parameter.
for step in range(390):
 ids=np.flatnonzero(active)
 if not len(ids):break
 p=pos[ids];v=direction[ids];l=L2[ids];dt=.26
 k1p=v;k1v=acc(p,l)
 k2p=v+dt*k1v/2;k2v=acc(p+dt*k1p/2,l)
 k3p=v+dt*k2v/2;k3v=acc(p+dt*k2p/2,l)
 k4p=v+dt*k3v;k4v=acc(p+dt*k3p,l)
 pn=p+dt*(k1p+2*k2p+2*k3p+k4p)/6;vn=v+dt*(k1v+2*k2v+2*k3v+k4v)/6
 crossed=(p[:,2]*pn[:,2]<0)
 frac=np.divide(p[:,2],p[:,2]-pn[:,2],out=np.zeros(len(ids)),where=crossed)
 cross=p+(pn-p)*frac[:,None]; rr=np.hypot(cross[:,0],cross[:,1]); valid=crossed&(rr>=6)&(rr<=19)
 ii=ids[valid];hit[ii]=True;hx[ii]=cross[valid,0];hy[ii]=cross[valid,1];hz[ii]=rr[valid]
 radius=np.linalg.norm(pn,axis=1);done=valid|(radius<2.04)|((radius>65)&(np.sum(pn*vn,axis=1)>0))
 pos[ids]=pn;direction[ids]=vn;active[ids[done]]=False
 if step%75==0: print(step,active.sum(),hit.sum(),flush=True)
phi=np.arctan2(hy,hx);r=np.maximum(hz,6)
# Disk emissivity and beaming are a simple illustrative model, not GRMHD.
base=np.where(hit,(6/r)**1.2*np.maximum(0,1-np.sqrt(6/r))**.35,0)
base*=np.clip(1+.65*np.sin(phi),.25,2)
texture=.55+.25*np.sin(3*phi+2.1*np.log(r))+.2*np.sin(11*phi-1.8*r)
brightness=np.maximum(0,base*texture);brightness/=max(brightness.max(),1e-9)
print('hits',hit.sum(),'bright',np.count_nonzero(brightness>.03),flush=True)

# Sample the actual ray-traced image into the site's existing particle population.
# Seeded sampling keeps the number and identity of particles unchanged.
import json
from pathlib import Path
rng=np.random.default_rng(3701)
weights=brightness**1.6; weights=weights/weights.sum()
chosen=rng.choice(len(weights),size=6650,p=weights)
forms_path=Path('assets/particles/forms.json')
data=json.loads(forms_path.read_text())
pts=[]
for i in chosen:
    iy,ix=divmod(int(i),W)
    xx=.685+((ix+rng.random())/W-.5)*.67
    yy=.5+((iy+rng.random())/H-.5)*.667
    dx=(xx-.685)*2.4; dy=(yy-.5)*1.5
    angle=np.arctan2(dy,dx)+np.pi/2
    v=float(np.clip(brightness[i]**.65,.08,1))
    pts.append(dict(x=round(xx,5),y=round(yy,5),v=round(v,5),angle=round(float(angle),5),length=round(float(2.2+9*v+14*(rng.random()>.965)*rng.random()),3),phase=round(float(rng.uniform(0,2*np.pi)),4),diskPhi=round(float(phi[i]),4),diskR=round(float(r[i]),3)))
pts.sort(key=lambda t:t['v'])
data['forms'][2]=pts
forms_path.write_text(json.dumps(data,separators=(',',':')))
Image.fromarray(np.uint8(brightness.reshape(H,W)**.65*255)).resize((1600,900),Image.Resampling.LANCZOS).save('assets/particles/form-2.webp',quality=85)

# Invert the traced disk intersections: disk polar coordinates -> image-plane ray.
# Each texel is an actual traced ray; the browser uses this map to project moving
# material without re-integrating an unchanged camera and spacetime every frame.
from scipy.spatial import cKDTree
hitids=np.flatnonzero(hit)
tree=cKDTree(np.column_stack((hx[hitids],hy[hitids])))
na,nr=512,128
angles=np.arange(na)*2*np.pi/na
radii=np.linspace(6,18.9,nr)
AA,RR=np.meshgrid(angles,radii)
query=np.column_stack(((RR*np.cos(AA)).ravel(),(RR*np.sin(AA)).ravel()))
dist, near=tree.query(query,k=8)
ids=hitids[near]
screenx=(ids%W)/(W-1); screeny=(ids//W)/(H-1)
# Prefer the direct image if more than one ray reaches the same location.
idealx=(query[:,0]+22)/44
idealy=(15-query[:,1]*up[1])/30
cost=dist+.1*np.hypot((screenx-idealx[:,None])*44,(screeny-idealy[:,None])*30)
sel=np.argmin(cost,axis=1);rows=np.arange(len(query));chosen_ids=ids[rows,sel]
map_rgba=np.zeros((nr,na,4),dtype=np.uint8)
map_rgba[:,:,0]=np.rint((chosen_ids%W).reshape(nr,na)/(W-1)*255).astype(np.uint8)
map_rgba[:,:,1]=np.rint((chosen_ids//W).reshape(nr,na)/(H-1)*255).astype(np.uint8)
map_rgba[:,:,2]=np.rint(np.clip(dist[rows,sel].reshape(nr,na)/1.2,0,1)*255).astype(np.uint8)
map_rgba[:,:,3]=255
Image.fromarray(map_rgba,'RGBA').save('assets/particles/schwarzschild-map.png',optimize=True)
