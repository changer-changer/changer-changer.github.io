---
layout: default
title: "我的世界观"
description: "一张还在改的地图：按依赖顺序，从我凭什么开始想，一层层排到人与 AI。"
---

{% assign wv = site.data.atlas.worldview %}
{% assign total = 0 %}
{% for l in wv.layers %}{% assign total = total | plus: l.posts.size %}{% endfor %}

<div class="atlas">
<section class="ax-hero">
  <p class="eyebrow">Worldview / 一张还在改的地图</p>
  <h1 class="ax-title">我的世界观</h1>
  <p class="ax-lead">这里不是一套完成的哲学。我把从小写下的东西按依赖顺序重排了一遍：先接受哪些前提，世界怎么运作，人是什么，我要什么，怎么选怎么做，最后是我身处的时代。每一层都站在前一层的上面。</p>
  <div class="ax-facts">
    <span><b>{{ wv.layers.size }}</b>层</span>
    <span><b>{{ total }}</b>篇</span>
  </div>
</section>

{% capture start_html %}{% endcapture %}
<section class="ax-start">
  <p class="ax-label">先读这两篇</p>
  <div class="ax-start-grid">
    {% for s in wv.start %}
      {% assign key = s %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
      {% if p %}
      <a class="ax-start-card" href="{{ p.url | relative_url }}">
        <span class="ax-num">{% if forloop.index < 10 %}0{% endif %}{{ forloop.index }}</span>
        <strong>{{ p.title }}</strong>
        <p>{% if forloop.first %}整张地图的缩短版。十分钟看完，再决定从哪一层读起。{% else %}给这套想法定的规矩。它比任何单条想法都高一层。{% endif %}</p>
      </a>
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="ax-rules" aria-label="三条规矩">
  {% for r in wv.rules %}
  <div class="ax-rule">
    <span class="ax-rule-n">0{{ forloop.index }}</span>
    <h2>{{ r.t }}</h2>
    <p>{{ r.d }}</p>
  </div>
  {% endfor %}
</section>

<div class="ax-body">
  <aside class="ax-rail" aria-label="层级导航">
    <nav class="ax-rail-nav">
      {% for l in wv.layers %}
      <a href="#{{ l.id }}"><span>{{ l.n }}</span>{{ l.short }}</a>
      {% endfor %}
    </nav>
  </aside>

  <div class="ax-stack">
    {% for l in wv.layers %}
    <section class="ax-layer" id="{{ l.id }}">
      <header class="ax-layer-head">
        <div class="ax-layer-num" aria-hidden="true">{{ l.n }}</div>
        <h2>{{ l.title }}</h2>
        <p class="ax-question">{{ l.q }}</p>
        <div class="ax-points">
          {% for pt in l.points %}<p>{{ pt }}</p>{% endfor %}
        </div>
      </header>
      <ol class="ax-list">
        {% for it in l.posts %}
          {% assign key = it.slug %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
          {% if p %}
          <li>
            <a href="{{ p.url | relative_url }}">
              <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y.%m.%d" }}</time>
              <span class="ax-item-t">{{ p.title }}</span>
              {% unless p.title contains it.q %}<span class="ax-item-q">{{ it.q }}</span>{% endunless %}
            </a>
          </li>
          {% endif %}
        {% endfor %}
      </ol>
    </section>
    {% endfor %}
  </div>
</div>

<section class="ax-next">
  <a href="{{ '/sparks/' | relative_url }}"><small>Sparks</small><strong>火花</strong><span>从这套想法里掉出来的句子 ↗</span></a>
  <a href="{{ '/research/' | relative_url }}"><small>Research</small><strong>研究</strong><span>我用它去做的事 ↗</span></a>
  <a href="{{ '/notes/' | relative_url }}"><small>Notes</small><strong>随笔</strong><span>不在体系里的那些文字 ↗</span></a>
</section>
</div>
{% include atlas-rail.html %}
