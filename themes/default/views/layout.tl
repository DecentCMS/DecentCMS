{! DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details. !}
{@meta name="generator" value="DecentCMS"/}
{@meta name="viewport" value="width=device-width, initial-scale=1"/}
{@style name="style"/}
{@script name="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"/}
{@script name="script"/}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" value="IE=edge"/>
    {@metas/}
    {@styles/}
    <title>{site.name} - {title}</title>
    <!--[if lt IE 9]>
      <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body role="document">
    {@shape shape=analytics/}
    <a href="#content" class="sr-only sr-only-focusable">{@t}Skip to main content{/t}</a>
    {@shape shape=navigation tag="nav" class="navbar navbar-inverse navbar-fixed-top"/}
    <div class="container" id="content" role="main">
      {?leftSidebar}
        {?rightSidebar}
          {@shape shape=leftSidebar tag="div" class="left-sidebar layout-lmr"/}
          {@shape shape=main tag="div" class="main layout-lmr"/}
          {@shape shape=rightSidebar tag="div" class="right-sidebar layout-lmr"/}
        {:else}
          {@shape shape=leftSidebar tag="div" class="left-sidebar layout-lm"/}
          {@shape shape=main tag="div" class="main layout-lm"/}
        {/rightSidebar}
      {:else}
        {?rightSidebar}
          {@shape shape=main tag="div" class="main layout-mr"/}
          {@shape shape=rightSidebar tag="div" class="right-sidebar layout-mr"/}
        {:else}
          {@shape shape=main tag="div" class="main layout-m"/}
        {/rightSidebar}
      {/leftSidebar}
    </div>
    {@shape shape=footer tag="footer" class="main-footer"/}
    {@scripts/}
  </body>
</html>