<?php

session_start();

require_once "../config/database.php";

$username = $_POST["username"];
$password = $_POST["password"];

$query = "SELECT * FROM petugas WHERE username = '$username'";

$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) === 1) {

    $petugas = mysqli_fetch_assoc($result);

    if (password_verify($password, $petugas["password"])) {

        $_SESSION["id_petugas"] = $petugas["id_petugas"];
        $_SESSION["nama_petugas"] = $petugas["nama_petugas"];

        header("Location: ../public/dashboard.php");
        exit;

    } else {

        echo "Password salah.";

    }

} else {

    echo "Username tidak ditemukan.";

}

?>