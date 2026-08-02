---
layout: default
title: 火花
permalink: /sparks/
---

<section class="sparks-page">
  <header class="page-hero" data-index="FRAGMENTS / IN MOTION">
    <p class="eyebrow">Sparks / 未完成的想法</p>
    <h1 data-split>火花</h1>
    <p>尚未成为系统，却足以改变下一次思考方向的句子。</p>
  </header>

  <div class="sparks-list">
    {% for spark in site.data.sparks %}
      {% assign linked_post = nil %}
      {% for post in site.posts %}
        {% if post.slug == spark.slug or post.url contains spark.slug %}
          {% assign linked_post = post %}
          {% break %}
        {% endif %}
      {% endfor %}
      <blockquote class="spark-item" data-cursor="FOLLOW">
        <span class="spark-number">{{ forloop.index | prepend: '0' }}</span>
        <p class="spark-text">{{ spark.text }}</p>
        {% if linked_post %}
          <cite class="spark-link">
            <a href="{{ linked_post.url | relative_url }}">{{ linked_post.title }}</a>
          </cite>
        {% endif %}
      </blockquote>
    {% endfor %}
  </div>
</section>
