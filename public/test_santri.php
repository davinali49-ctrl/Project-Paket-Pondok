<?php

require_once "../config/database.php";

$query = "SELECT * FROM santri";

$result = mysqli_query($conn, $query);

while ($santri = mysqli_fetch_assoc($result)) {
    echo $santri["nama_santri"] . " - ";
    echo $santri["asrama"] . "<br>";
}

?>