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
    <title>{title}</title>
    <!--[if lt IE 9]>
      <script src="//oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="//oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body role="document">
    <a href="#content" class="sr-only sr-only-focusable">{@t}Skip to main content{/t}</a>
    {@shape shape=navigation tag="nav" class="navbar navbar-inverse navbar-fixed-top"/}
    <div class="container" id="content" role="main">
      {@shape shape=main/}
    </div>
    {@shape shape=footer tag="footer" class="main-footer"/}
    {@scripts/}
  </body>
</html>