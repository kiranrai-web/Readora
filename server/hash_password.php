<?php
$password = "admin123";
$hash = password_hash($password, PASSWORD_BCRYPT);
echo "UPDATE users SET password = '$hash' WHERE email = 'admin@readora.com';";
?>
