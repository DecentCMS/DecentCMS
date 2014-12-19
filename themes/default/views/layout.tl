{! DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details. !}
{@meta name="generator" value="DecentCMS"/}
{@meta name="viewport" value="width=device-width, initial-scale=1"/}
{@style name="bootstrap"/}
{@script name="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"/}
{@script name="bootstrap"/}
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" value="IE=edge"/>
    {@metas/}
    {@styles/}
    <title>{title}</title>
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <h1>{title}</h1>
    {@shape shape=navigation/}
    {@shape shape=main/}
    {@scripts/}
  </body>
</html>