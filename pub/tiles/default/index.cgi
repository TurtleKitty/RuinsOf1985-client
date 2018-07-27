#!/usr/bin/perl

use strict;

my @filez = `ls *.png`;

my $images = "";

for my $f (@filez) {
    chomp($f);
    $images .= qq|<img src="$f" />\n|;
}

my $html = qq|<!DOCTYPE html>
<html>
<head>
</head>
<body>

$images

</body>
</html>|;


print $html;
