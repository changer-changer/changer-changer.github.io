---
layout: default
title: "研究与 Research 思考"
description: "正在走的几条研究主线，做研究时想问题的方法，和给它们打底的技术笔记。"
---

{% assign rs = site.data.atlas.research %}

<div class="atlas">
<section class="ax-hero">
  <p class="eyebrow">Research / 刚刚开始</p>
  <h1 class="ax-title is-long">研究<em>与</em> Research 思考</h1>
  <p class="ax-lead">{{ rs.lead }}</p>
</section>

<section class="ax-lines">
  <p class="ax-label">正在走的主线</p>
  <div class="ax-lines-grid">
    {% for l in rs.lines %}
    <a class="ax-line-card" href="{{ l.href | relative_url }}">
      <span class="ax-num">{{ forloop.index }}</span>
      <span class="ax-line-en">{{ l.en }}</span>
      <strong>{{ l.t }}</strong>
      <p>{{ l.d }}</p>
      <span class="ax-inline-link">项目记录 ↗</span>
    </a>
    {% endfor %}
  </div>
</section>

{% for g in rs.groups %}
<section class="ax-section" id="{{ g.id }}">
  <header class="ax-section-head">
    <p class="ax-label">0{{ forloop.index }} / {{ g.en }}</p>
    <h2>{{ g.title }}</h2>
    <p>{{ g.lead }}</p>
  </header>
  {% if g.id == "foundations" %}
  <ul class="ax-compact-grid">
    {% for it in g.posts %}
      {% assign key = it.slug %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
      {% if p %}<li><a href="{{ p.url | relative_url }}"><span>{{ p.date | date: "%Y.%m.%d" }}</span>{{ p.title }}</a></li>{% endif %}
    {% endfor %}
  </ul>
  {% else %}
  <ol class="ax-list ax-list-lg">
    {% for it in g.posts %}
      {% assign key = it.slug %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
      {% if p %}
      <li><a href="{{ p.url | relative_url }}">
        <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y.%m.%d" }}</time>
        <span class="ax-item-t">{{ p.title }}</span>
        {% if it.q %}{% unless p.title contains it.q %}<span class="ax-item-q">{{ it.q }}</span>{% endunless %}{% endif %}
      </a></li>
      {% endif %}
    {% endfor %}
  </ol>
  {% endif %}
  {% if g.id == "thinking" %}
  <div class="ax-cross">
    <p class="ax-label">世界观里和做研究直接相关的</p>
    <div class="ax-cross-list">
      {% for s in site.data.atlas.cross %}
        {% assign key = s.slug %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
        {% if p %}<a href="{{ p.url | relative_url }}">{{ p.title }} ↗</a>{% endif %}
      {% endfor %}
    </div>
  </div>
  {% endif %}
</section>
{% endfor %}

<section class="ax-next">
  <a href="{{ '/resume/research/' | relative_url }}"><small>CV</small><strong>科研版履历</strong><span>项目与产出的完整记录 ↗</span></a>
  <a href="{{ '/worldview/' | relative_url }}"><small>Worldview</small><strong>世界观</strong><span>这些研究背后的判断 ↗</span></a>
</section>
</div>
{% include atlas-rail.html %}
