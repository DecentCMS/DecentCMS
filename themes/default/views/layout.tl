{! DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details. !}
{@meta name="generator" value="DecentCMS"/}
{@meta charset="utf-8"/}
{@meta http-equiv="X-UA-Compatible" value="IE=edge"/}
{@meta name="viewport" value="width=device-width, initial-scale=1"/}
{@style name="style"/}
{@script name="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"/}
{@script name="script"/}
<!DOCTYPE html>
<html lang="en">
  <head>
    {@metas/}
    {@styles/}
    <title>{site.name} - {title}</title>
    <!--[if lt IE 9]>
      <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body role="document">
    {@zone name="analytics"/}
    <a href="#content" class="sr-only sr-only-focusable">{@t}Skip to main content{/t}</a>
    {@zone name="navigation" tag="nav" class="navbar navbar-inverse navbar-fixed-top"/}
    <div class="container" id="content" role="main">
      {?zones.leftSidebar}
        {?zones.rightSidebar}
          {@zone name="leftSidebar" tag="div" class="left-sidebar layout-lmr"/}
          {@zone name="main" tag="div" class="main layout-lmr"/}
          {@zone name="rightSidebar" tag="div" class="right-sidebar layout-lmr"/}
        {:else}
          {@zone name="leftSidebar" tag="div" class="left-sidebar layout-lm"/}
          {@zone name="main" tag="div" class="main layout-lm"/}
        {/zones.rightSidebar}
      {:else}
        {?zones.rightSidebar}
          {@zone name="main" tag="div" class="main layout-mr"/}
          {@zone name="rightSidebar" tag="div" class="right-sidebar layout-mr"/}
        {:else}
          {@zone name="main" tag="div" class="main layout-m"/}
        {/zones.rightSidebar}
      {/zones.leftSidebar}
    </div>
    {@zone name="footer" tag="footer" class="main-footer"/}
    {@scripts/}
  </body>
</html>