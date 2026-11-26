---
layout: default
title: "随笔"
description: "不在体系里的那些文字：随笔、日记、观点、读书笔记，按写作的形态分开。"
---

{% assign nt = site.data.atlas.notes %}

<div class="atlas">
<section class="ax-hero">
  <p class="eyebrow">Notes / 不成体系的部分</p>
  <h1 class="ax-title">随笔</h1>
  <p class="ax-lead">{{ nt.lead }}</p>
  <div class="ax-utils">
    <a href="{{ '/archive/' | relative_url }}">按时间 ↗</a>
    <a href="{{ '/categories/' | relative_url }}">按主题 ↗</a>
    <a href="{{ '/tags/' | relative_url }}">按标签 ↗</a>
    <a href="{{ '/search/' | relative_url }}">搜索 ↗</a>
  </div>
</section>

<div class="ax-body ax-body-notes">
  <aside class="ax-rail" aria-label="分类导航">
    <nav class="ax-rail-nav">
      {% for s in nt.sections %}
      <a href="#{{ s.id }}"><span>{% if forloop.index < 10 %}0{% endif %}{{ forloop.index }}</span>{{ s.title }}</a>
      {% endfor %}
    </nav>
  </aside>

  <div class="ax-stack">
    {% for s in nt.sections %}
    <section class="ax-layer ax-group" id="{{ s.id }}">
      <header class="ax-layer-head">
        <div class="ax-layer-num" aria-hidden="true">{% if forloop.index < 10 %}0{% endif %}{{ forloop.index }}</div>
        <p class="ax-en">{{ s.en }}</p>
        <h2>{{ s.title }}</h2>
        <p class="ax-question">{{ s.d }}</p>
      </header>
      <ol class="ax-list">
        {% for sl in s.slugs %}
          {% assign key = sl %}{% assign p = site.posts | where_exp: "p", "p.slug == key" | first %}
          {% if p %}
          <li><a href="{{ p.url | relative_url }}">
            <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y.%m.%d" }}</time>
            <span class="ax-item-t">{{ p.title }}</span>
            {% if p.title == "未命名笔记" and p.content.size > 0 %}<span class="ax-item-q">{{ p.excerpt | strip_html | truncate: 34 | strip }}</span>{% endif %}
          </a></li>
          {% endif %}
        {% endfor %}
      </ol>
    </section>
    {% endfor %}
  </div>
</div>

<section class="ax-next">
  <a href="{{ '/worldview/' | relative_url }}"><small>Worldview</small><strong>世界观</strong><span>这些文字背后成体系的部分 ↗</span></a>
  <a href="{{ '/sparks/' | relative_url }}"><small>Sparks</small><strong>火花</strong><span>我最喜欢的一些句子 ↗</span></a>
</section>
</div>
{% include atlas-rail.html %}
