/* Copyright (C) VANSU, Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by VANSU <vansu@vansu.org>, August 2020
 * Permission is hereby prohibited, non-granted strictly, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software with restriction, including limitation to prohibited: The rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * Proprietary and confidential!
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
*/
const vbody = document.getElementsByTagName('body')[0];
// =================================================
var maindiv = document.createElement("div");
maindiv.id="main";
maindiv.classList.add("center","main","maxwidth700");
vbody.appendChild(maindiv);
// =================================================
var divtexth1 = document.createElement("div");
divtexth1.innerHTML='<h3 class="c3h1"> Ứng dụng xem nhanh bát tự bất kỳ, từ năm 1600 đến năm 5000 </h3>'+
'<h5 class="left padding8" style="margin-top: 7px;margin-bottom: 7px;"><blockquote><b>Thông tin bát tự và lời bàn được tính toán dựa theo thuật toán khoa học - một thứ khoa học mà máy tính có thể tạo ra kết quả, nhưng người làm ra cỗ máy đó lại không thể giải thích được tại sao lại có kết quả ấy. Và thế là từ đó, khoa học lấp liếm cái sự hiểu biết nông cạn của mình bằng việc... xem những điều mình không thể giải thích, là những điều vốn không tồn tại. Và những ai tin vào điều không tồn tại thì được gọi là mê tín/ ảo huyền.</b></blockquote></h5>'+
'<p class="left padding8"> Để bắt đầu, trước tiên hãy nhập vào giờ, ngày, tháng, năm sinh của bạn, dương lịch hay âm lịch đều được.</br>Bạn lưu ý sử dụng định dạng giờ sẽ là từ 0 giờ đến 23 giờ.<br> Kết quả được hiển thị sẽ không thể đầy đủ, do ngôn ngữ lập trình và máy móc có giới hạn, nếu bạn muốn xem đầy đủ, hãy tìm tác giả và sử dụng ngôn ngữ nhân sinh để giao tiếp giữa người với người.</p>'+
'';
divtexth1.classList.add("whiteheighteach");

document.getElementById('main').appendChild(divtexth1);
// =================================================
var form = document.createElement("form");
	form.name="vcxcxcxcyear";
	form.classList.add("center");
	form.setAttribute('autocomplete','false');

var inputgio = document.createElement("input");
	inputgio.type='text';
	inputgio.name="gio";
//	inputgio.setAttribute('disabled','');
//	inputgio.value='1';
	inputgio.classList.add("optionheight","whitewidtheach",'w95');
	inputgio.placeholder="Giờ sinh";
	inputgio.pattern="[0-9]{1,2}";
	inputgio.setAttribute('maxlength','2');
	inputgio.setAttribute('oninput',"this.value=this.value.replace(/[^0-9]/g,'');");
	inputgio.setAttribute('autocomplete','false');
	

var inputday = document.createElement("input");
	inputday.type='text';
	inputday.name="ngay";
	inputday.classList.add("optionheight","whitewidtheach",'w95');
	inputday.placeholder="Ngày sinh";
	inputday.pattern="[0-9]{1,2}";
	inputday.setAttribute('maxlength','2');
	inputday.setAttribute('oninput',"this.value=this.value.replace(/[^0-9]/g,'');");
	inputday.setAttribute('autocomplete','false');

var inputmonth = document.createElement("input");
	inputmonth.type='text';
	inputmonth.name="thang";
	inputmonth.classList.add("optionheight","whitewidtheach",'w95');
	inputmonth.placeholder="Tháng sinh";
	inputmonth.pattern="[0-9]{1,2}";
	inputmonth.setAttribute('oninput',"this.value=this.value.replace(/[^0-9]/g,'');");
	inputmonth.setAttribute('maxlength','2');
	inputmonth.setAttribute('autocomplete','false');

var inputyear = document.createElement("input");
	inputyear.type='number';
	inputyear.name="nam";
	inputyear.classList.add("optionheight","whitewidtheach",'w95');
	inputyear.placeholder="Năm sinh";
	inputyear.pattern="[0-9]{1,4}";
	inputyear.setAttribute('oninput',"this.value=this.value.replace(/[^0-9]/g,'');");
	inputyear.setAttribute('maxlength','4');
	inputyear.setAttribute('min','1600');
	inputyear.setAttribute('max','5000');
	inputyear.setAttribute('autocomplete','false');

var optionsex = document.createElement("select");
	optionsex.classList.add("optionheight","whitewidtheach",'w95');
	optionsex.id='sex';
	optionsex.name="sex";
var option3 = document.createElement("option");
	option3.id="sex0";
	option3.val="";
	option3.innerHTML="Giới tính"
	optionsex.appendChild(option3);
var option1 = document.createElement("option");
	option1.val="nam";
	option1.id="sexnam";
	option1.innerHTML="Nam"
	optionsex.appendChild(option1);
var option2 = document.createElement("option");
	option2.id="sexnu";
	option2.val="nu";
	option2.innerHTML="Nữ"
	optionsex.appendChild(option2);

var optiondlal = document.createElement("select");
	optiondlal.classList.add("optionheight","whitewidtheach",'w125');
	optiondlal.id='dlal';
	optiondlal.name="dlal";
var option3 = document.createElement("option");
	option3.val="duong";
	option3.id="dlalduong";
	option3.innerHTML="dương"
	
	optiondlal.appendChild(option3);
var option4 = document.createElement("option");
	option4.val="am";
	option4.id="dlalam";
	option4.innerHTML="âm (bảo trì)"
	option4.disabled=true;
	optiondlal.appendChild(option4);


var submit = document.createElement("button");
	submit.type='submit';
	submit.innerHTML='Xem';

form.appendChild(optionsex);
form.appendChild(inputgio);
form.appendChild(inputday);
form.appendChild(inputmonth);
form.appendChild(inputyear);
form.appendChild(optiondlal);
form.appendChild(submit);


var nw = document.createElement("div");
	nw.classList.add("center","mt-1");
	nw.id="now";


var kq = document.createElement("div");
	kq.classList.add("left","mt-1");
	kq.id="kq";


var tv = document.createElement("div");
	tv.classList.add("left","mt-1");
	tv.id="tv";


var meta = document.createElement("meta");
	meta.setAttribute('charset','utf-8');
	document.head.appendChild(meta);
var meta = document.createElement("meta");
	meta.name='viewport'
	meta.setAttribute('content','width=device-width, initial-scale=0.95');
	document.head.appendChild(meta);
var meta = document.createElement("meta");
	meta.name='referrer'
	meta.setAttribute('content','always');
	document.head.appendChild(meta);

/*
var manifest = document.createElement("link");
	manifest.rel='manifest';
	manifest.href="/lich/manifest.webmanifest";
*/

	
document.title='Mở Thiên Cơ nhìn thấu Vạn Sự.';
//document.head.appendChild(manifest);
document.getElementById('main').appendChild(form);
document.getElementById('main').appendChild(nw);
document.getElementById('main').appendChild(kq);
document.getElementById('main').appendChild(tv);
 

// =================================================
var licham=false;
// =================================================
$(function(){
var okzd=false;
$('body').on('click', 'a[name]', function(e) {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('h3[name="tuvitongwat"]').offset().top-15
    }, 250);

})

$('body').on('click', 'a[href*="#"]', function(e) {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('[name="'+($(this).attr('href').replace('#',''))+'"]').offset().top-15
    }, 250);

})

$('body').on('click', 'a[ihref*="/que"]', function(e) {

	
	if(okzd===false){
	okzd=true;
	var href=$(this).attr('ihref');
	fetch(href).then(res => {return res.text();}).then(data => {
   		var parser = new DOMParser();
		var htmlDoc = parser.parseFromString(data, 'text/html');

		
		var table= htmlDoc.querySelector('.noidung-que').cloneNode(true);
			$('.vung-giai-doan .noidung-que').remove();
		 e.target.parentNode.appendChild(table);
		 okzd++;
	   		
});
} else{okzd=false;$('.vung-giai-doan .noidung-que').remove();}
})





function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}


$('body').on('click', '#wamilch,.wamilch', function(e) {

		if(licham==false){
		licham=true;
        var ifrm = document.createElement("iframe");
        ifrm.setAttribute("src", "/module.html");
        ifrm.style.width = "100%";
        ifrm.style.height = "480px";
        ifrm.id="style-3";
        ifrm.frameBorder='0';
        ifrm.className='framw_lich';
        document.querySelector("#main").style.maxWidth='800px';
      // document.querySelector("#now").appendChild(ifrm);
	insertAfter(document.querySelector("#now"),ifrm)
        } else {
        document.querySelector("#main").style.maxWidth='725px';
        $("iframe,.framw_lich").remove();
        licham=false;
        }

})



})





