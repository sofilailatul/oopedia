<?php
$lines = file('c:\laragon\www\oopedia\storage\logs\laravel.log');
$last_err = null;
foreach($lines as $i => $line) {
    if (strpos($line, 'Error joining class') !== false) {
        $last_err = $line;
    }
}
if ($last_err) {
    $start = strpos($last_err, '{');
    if ($start !== false) {
        $json = substr($last_err, $start);
        $data = json_decode($json, true);
        if ($data && isset($data['error'])) {
            file_put_contents('err.txt', $data['error']);
        }
    }
}
