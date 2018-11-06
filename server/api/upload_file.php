<?php
/*
if ((($_FILES["file"]["type"] == "image/gif")
|| ($_FILES["file"]["type"] == "image/jpeg")
|| ($_FILES["file"]["type"] == "image/pjpeg")
|| ($_FILES["file"]["type"] == "image/png")
|| ($_FILES["file"]["type"] == "image/jpg")
|| ($_FILES["file"]["type"] == "uploadedfile"))
&& ($_FILES["file"]["size"] < 2048000))
*/
if($_FILES["file"]["size"] < 2048000)
  {
	  	
  if ($_FILES["file"]["error"] > 0)
    {
    echo "Return Code: " . $_FILES["file"]["error"] . "<br />";
    }
  else
    {

		echo "Upload: " . $_FILES["file"]["name"] . "<br />";
		echo "Type: " . $_FILES["file"]["type"] . "<br />";
		echo "Size: " . ($_FILES["file"]["size"] / 1024) . " Kb<br />";
		echo "Temp file: " . $_FILES["file"]["tmp_name"] . "<br />";

		if (file_exists("upload/" . $_FILES["file"]["name"]))
		{
			echo $_FILES["file"]["name"] . " already exists. ";
		}
		else
		  {
			  $t=time();
			  $phone=$_FILES["file"]["name"];
			  move_uploaded_file($_FILES["file"]["tmp_name"],
			  "upload/" .$t);
			  $con = mysql_connect("localhost","if","123456");
			  if (!$con)
			  {
			  die('Could not connect: ' . mysql_error());
			  }
			  echo "Stored in: " . "upload/" .$t;
			  mysql_select_db("db_if", $con);
			  mysql_query("UPDATE `db_if`.`tb_user` SET `icon` = '$t' WHERE `tb_user`.`phone` = '$phone'",$con);
			  mysql_close($con);
		  }
    }
  }
  
else
  {
	  echo $_FILES["file"]["type"];
  echo "Invalid file";
  }



?>
