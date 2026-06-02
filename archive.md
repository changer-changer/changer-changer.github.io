---
layout: default
title: 归档
permalink: /archive/
---

<section class="page-hero">
  <p class="eyebrow">Archive</p>
  <h1>文章归档</h1>
  <p>按时间回看写作轨迹。适合找某个阶段的集中思考。</p>
</section>

{% assign postsByYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
<section class="archive-timeline">
{% for year in postsByYear %}
  <div class="archive-year-block">
    <h2 class="archive-year">{{ year.name }}</h2>
    <div class="archive-list">
      {% for post in year.items %}
      <article class="archive-item">
        <time>{{ post.date | date: "%m月%d日" }}</time>
        <a class="archive-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
        {% if post.categories.size > 0 %}<span>{{ post.categories | first }}</span>{% endif %}
      </article>
      {% endfor %}
    </div>
  </div>
{% endfor %}
</section>
