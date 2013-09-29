<?php

//Setup DB connection
$dbserver='localhost';
$dbuser='root';
$dbpass='';
$link = mysql_connect($dbserver,$dbuser,$dbpass); 
if (!$link) { 
	die('Could not connect to MySQL: ' . mysql_error()); 
} 
$dbname='simon_test';
mysql_select_db($dbname, $link);


//$q=$_GET["q"];

switch($_GET["t"]){
	case 'getSourceList':
		//get the list of data sources
		$str="SELECT * FROM data_source";
		$result=mysql_query($str);
		while($row = mysql_fetch_array($result))
		{
		  echo '<option value="' . $row['id'] . '">' . $row['url'] . '</option>';
		}
		break;

		
	case 'getArticleId':
		//check if an article exists (insert if not) and return the id
		$str="SELECT id FROM article WHERE source_id=" . $_GET["s"] . " AND name='" . $_GET["n"] . "'";
		$result=mysql_query($str);
		$row = mysql_fetch_array($result);
		
		if(!$row){
			//article does not exist, insert it into the db
			$str_ins="INSERT INTO article (id, name, source_id) VALUES (NULL, '" . $_GET["n"] . "', '" . $_GET["s"] . "')";
			$result=mysql_query($str_ins);
			
			//get the new id
			$result=mysql_query($str);
			$row = mysql_fetch_array($result);
		} 
		echo $row['id'];	//return the id
		break;

		
	case 'getLinks':
		//get all links for a given article
		$str="SELECT a2.id, l.link_rank, a2.name as link_name, a.source_id, d.url
		FROM article as a
		JOIN data_source as d on a.source_id = d.id
		LEFT OUTER JOIN link as l ON a.id = l.article_id
		LEFT OUTER JOIN article as a2 ON a2.id = l.link_id
		WHERE a.id=" . $_GET["q"] . "
		ORDER BY a.id, l.link_rank DESC";

		$result=mysql_query($str);
		echo '<table border=1><tr><th>id</th><th>link_rank</th><th>link_name</th></tr>';
		while($row = mysql_fetch_array($result))
		{
			
		  $to_echo = '<tr><td class="aLink" ';
		  //include the onclick function: toggleLinks(Article_id ------------------------------------------------>, destArticle_id, window_id------------------------------>, dataSourceId-------->, dataSource-------->, articleTitle------------>)
		  $to_echo = $to_echo . 'onclick="toggleLinks($(this).parents(\'.window\').find(\'.article\').attr(\'id\'),'.$row['id'] .',$(this).parents(\'.window\').attr(\'id\'),'.$row['source_id'] .',\''.$row['url'] .'\',\''.$row['link_name'] .'\')">';
		  $to_echo = $to_echo . $row['id'] . '</td><td>'. $row['link_rank'] .'</td><td>'. $row['link_name'].'</td></tr>';
		  echo $to_echo;
		  //echo '<tr><td class="aLink" onclick="toggleLinks($(this).parents(\'.window\').find(\'.article\').attr(\'id\'),'.$row['id'] .',$(this).parents(\'.window\').attr(\'id\'),'.$row['source_id'] .',\''.$row['url'] .'\',\''.$row['link_name'] .'\')">'.$row['id'] . '</td><td>'. $row['link_rank'] .'</td><td>'. $row['link_name'].'</td></tr>';
		}
		echo '</table>';
		break;
}



//close DB connection
mysql_close($link); 

//echo '<p> line 22222 </p>';
//echo '<select name="sport"><option>'.join('</option><option>',$players).'</select>';
?> 