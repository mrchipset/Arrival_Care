<?php
ini_set('display_startup_errors',1); 
function createuser($con,$name,$pwd,$phone)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM user_info
WHERE phone='$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		return false;
	}
	else
	{
		mysql_query("INSERT INTO `user_info`(`id`, `phone`, `passwd`, `nickname`, `residence`) VALUES (NULL,'$phone','$pwd','$name','')",$con);
		mysql_query("INSERT INTO `friend_info`(`id`, `phone`, `friends`) VALUES (NULL,'$phone','')",$con);
		return true;
	}
}



function check_pwd($con,$phone,$pwd)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM user_info
WHERE phone='$phone' and passwd='$pwd'",$con);
	if(mysql_num_rows($result)>0)
		return true;
	else
		return false;
}

//修改密码
function updatepwd($con,$phone,$old_pwd,$new_pwd)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM user_info
WHERE phone='$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		mysql_query("UPDATE user_info SET `passwd` = '$new_pwd' WHERE `phone`= '$phone' and `passwd`= '$old_pwd'",$con);
		return true;
	}else
	{
		return false;
	}
}


function login($con,$pwd,$phone)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM user_info
WHERE phone='$phone' and passwd='$pwd' or nickname='$phone' and passwd='$pwd'",$con);
	if(mysql_num_rows($result)>0)
	{
		return true;
	}else
	{
		return false;
	}
}





function getname($con,$phone)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM user_info WHERE `phone` = '$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		$msg = mysql_fetch_array($result);
		return $msg['nickname'];
	}else
		return ‘’;
		
}


function updatename($con,$phone,$name)
{
	mysql_select_db("arrival", $con);
	mysql_query("UPDATE `user_info` SET `nickname` = '$name' WHERE `phone` = '$phone'",$con);
	return 1;
}




function getfriends($con,$phone)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM friend_info where phone = '$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		$msg = mysql_fetch_array($result);
		return $msg['friends'];
	}
}

function addfriend($con,$phone1,$phone2)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM `friend_info` WHERE phone='$phone2'",$con);
	if(mysql_num_rows($result)>0)
	{
		$msg = mysql_fetch_array($result);
		if($msg['friends']!=NULL)
			$friends=$msg['friends']."|".$phone1;
		else
			$friends=$phone1;
		mysql_query("UPDATE `friend_info` SET friends ='$friends' where phone=$phone2 ",$con);


		$result=mysql_query("SELECT * FROM `friend_info` WHERE phone='$phone1'",$con);
		if(mysql_num_rows($result)>0)
		{
			$msg = mysql_fetch_array($result);
			if($msg['friends']!=NULL)
				$friends=$msg['friends']."|".$phone2;
			else
				$friends=$phone2;
			mysql_query("UPDATE `friend_info` SET friends ='$friends' where phone=$phone1 ",$con);
			return 1;
		}
		else return 0;
	}	
	return 0;
}

function delfriend($con,$phone1,$phone2)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM `friend_info` WHERE phone='$phone2'",$con);
	if(mysql_num_rows($result)>0)
	{
		$msg = mysql_fetch_array($result);
		if($msg['friends']!=NULL)
		{
			$friends=$msg['friends'];
			$parts=explode("|",$friends);
			$parts=array_diff($parts,[$phone1]);
			$friends=implode("|", $parts);
			mysql_query("UPDATE `friend_info` SET friends ='$friends' where phone=$phone2 ",$con);
		}

		$result=mysql_query("SELECT * FROM `friend_info` WHERE phone='$phone1'",$con);
		if(mysql_num_rows($result)>0)
		{
			$msg = mysql_fetch_array($result);
			if($msg['friends']!=NULL)
			{
				$friends=$msg['friends'];
				$parts=explode("|",$friends);
				$parts=array_diff($parts,[$phone2]);
				$friends=implode("|", $parts);
				mysql_query("UPDATE `friend_info` SET friends ='$friends' where phone=$phone1 ",$con);
				return 1;
			}
		}
		else return 0;
	}	
	return 0;
}




function updateresidence($con,$phone,$residence)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM `user_info` WHERE phone='$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		$msg = mysql_fetch_array($result);
		if($msg['residence']!=NULL)
			$res=$msg['residence']."|".$residence;
		else
			$res=$residence;
		mysql_query("UPDATE `user_info` SET residence ='$res' where phone=$phone ",$con);
		return 1;
	} 
	return 0;
}

function getuserinfo($con,$phone)
{
	mysql_select_db("arrival", $con);
	$result=mysql_query("SELECT * FROM `user_info` WHERE phone='$phone' or nickname='$phone'",$con);
	if(mysql_num_rows($result)>0)
	{
		$info = mysql_fetch_array($result);
		return $info['phone'].";".$info['nickname'].";".$info['residence'];
	} 
	return "";
}

$_REQUEST_METHOD=$_SERVER['REQUEST_METHOD'];
if($_REQUEST_METHOD == "POST")
{
$json=file_get_contents("php://input");
//echo $json;
//ƒ$json=base64_decode($json);
//echo $json;
$obj=json_decode($json);
//echo $json."<br>";
$con = mysql_connect("localhost","root","zhou,./0810");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }




switch($obj->api)
{
	case 'createuser':
		if(createuser($con,$obj->name,$obj->pwd,$obj->phone))
			echo 1;
		else
			echo 0;
		break;
	case 'updatepwd':
		if(check_pwd($con,$obj->phone,$obj->old_pwd))
			if(updatepwd($con,$obj->phone,$obj->old_pwd,$obj->pwd))
				echo 1 ;
			else
				echo 0;
		else
			echo 0;
		break;
	case 'updateresidence':
		echo(updateresidence($con,$obj->phone,$obj->residence));
		break;
	case 'login':
		if(login($con,$obj->pwd,$obj->phone))
			echo 1 ;
		else
			echo 0;
		break;
	case 'addfriend':
		echo addfriend($con,$obj->phone1,$obj->phone2);
		break;	
	case 'getname':
		echo getname($con,$obj->phone);
		break;
	case 'updatename':
		echo updatename($con,$obj->phone,$obj->name);
		break;
	case 'getfriends':
		echo getfriends($con,$obj->phone);
		break;
	case 'getuserinfo':
		echo(getuserinfo($con,$obj->phone));
		break;
	case 'delfriend':
		echo(delfriend($con,$obj->phone1,$obj->phone2));
		break;
	default:
		echo 0;
		break;
}
mysql_close($con);
}else if($_REQUEST_METHOD == "GET")
{
echo 1 ;
}



?>
