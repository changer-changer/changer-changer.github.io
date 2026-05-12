---
layout: default
title: 归档
permalink: /archive/
---

<h1 class="page-title">文章归档</h1>

{% assign postsByYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in postsByYear %}
<h2 class="archive-year">{{ year.year }}</h2>
<ul class="archive-list">
  {% for post in year.items %}
  <li>
    <span class="archive-date">{{ post.date | date: "%m月%d日" }}</span>
    <a class="archive-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </li>
  {% endfor %}
</ul>
{% endfor %}
