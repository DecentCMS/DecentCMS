{! DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details. !}
<div class="container">
  <div class="navbar-header">
    <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
      <span class="sr-only">{@t}Toggle navigation{/t}</span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
      <span class="icon-bar"></span>
    </button>
    <a class="navbar-brand" href="/"><img src="/media/logo.svg" alt="{site.name}"/><span class="site-name">{site.name}</span></a>
  </div>
  <div id="navbar" class="navbar-collapse collapse">
    <ul class="nav navbar-nav">
      {#items}
        <li class="menu-item {name}{@eq key=href value=current} active{/eq}{?.items} dropdown{/.items}">
          <a href="{href}"{?.items} class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false"{/.items}>{title}{?.items} <span class="caret"></span>{/.items}</a>
          {?.items}
            <ul class="dropdown-menu" role="menu">
            {#.items}
              <li class="menu-item {name}{@eq key=href value=current} active{/eq}">
                <a href="{href}">{title}</a>
              </li>
            {/.items}
            </ul>
          {/.items}
        </li>
      {/items}
    </ul>
  </div>
</div>