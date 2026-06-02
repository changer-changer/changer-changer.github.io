---
layout: default
title: 火花
permalink: /sparks/
---

<section class="sparks-page">
  <div class="section-head">
    <p class="eyebrow">Sparks</p>
    <h1>火花</h1>
    <p class="hero-lede">能激发联想的句子，联系到相关文章。</p>
  </div>

  <div class="sparks-list">
    {% for spark in site.data.sparks %}
      {% assign linked_post = nil %}
      {% for post in site.posts %}
        {% if post.slug == spark.slug or post.url contains spark.slug %}
          {% assign linked_post = post %}
          {% break %}
        {% endif %}
      {% endfor %}
      <blockquote class="spark-item">
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
