// ==UserScript==
// @name        New script 
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      -
// @description 03:19:31, 14/9/2020
// ==/UserScript==
var urlParams = new URLSearchParams(window.location.search.replace(/\+/g,'%2B'));
var PI = Math.PI;

/* Discard the fractional part of a number, e.g., Math.floor(3.2) = 3 */


/* Compute the (integral) Julian day number of day dd/mm/yyyy, i.e., the number 
 * of days between 1/1/4713 BC (Julian calendar) and dd/mm/yyyy. 
 * Formula from http://www.tondering.dk/claus/calendar.html
 */
function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function jdFromDate(dd, mm, yy){var a, y, m, jd;a = Math.floor((14 - mm) / 12);y = yy+4800-a;m = mm+12*a-3;jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;if (jd < 2299161) {jd = dd + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - 32083;};return jd;}

/* Convert a Julian day number to day/month/year. Parameter jd is an integer */
function jdToDate(jd) {
	var a, b, c, d, e, m, day, month, year;
	if (jd > 2299160) { // After 5/10/1582, Gregorian calendar
		a = jd + 32044;
		b = Math.floor((4*a+3)/146097);
		c = a - Math.floor((b*146097)/4);
	} else {
		b = 0;
		c = jd + 32082;
	}
	d = Math.floor((4*c+3)/1461);
	e = c - Math.floor((1461*d)/4);
	m = Math.floor((5*e+2)/153);
	day = e - Math.floor((153*m+2)/5) + 1;
	month = m + 3 - 12*(Math.floor((m/10)));
	year = b*100 + d - 4800 + Math.floor(m/10);
	return new Array(day, month, year);
}

/* Compute the time of the k-th new moon after the new moon of 1/1/1900 13:52 UCT 
 * (measured as the number of days since 1/1/4713 BC noon UCT, e.g., 2451545.125 is 1/1/2000 15:00 UTC).
 * Returns a floating number, e.g., 2415079.9758617813 for k=2 or 2414961.935157746 for k=-2
 * Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
 */
function NewMoon(k) {
	var T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew;
	T = k/1236.85; // Time in Julian centuries from 1900 January 0.5
	T2 = T * T;
	T3 = T2 * T;
	dr = PI/180;
	Jd1 = 2415020.75933 + 29.53058868*k + 0.0001178*T2 - 0.000000155*T3;
	Jd1 = Jd1 + 0.00033*Math.sin((166.56 + 132.87*T - 0.009173*T2)*dr); // Mean new moon
	M = 359.2242 + 29.10535608*k - 0.0000333*T2 - 0.00000347*T3; // Sun's mean anomaly
	Mpr = 306.0253 + 385.81691806*k + 0.0107306*T2 + 0.00001236*T3; // Moon's mean anomaly
	F = 21.2964 + 390.67050646*k - 0.0016528*T2 - 0.00000239*T3; // Moon's argument of latitude
	C1=(0.1734 - 0.000393*T)*Math.sin(M*dr) + 0.0021*Math.sin(2*dr*M);
	C1 = C1 - 0.4068*Math.sin(Mpr*dr) + 0.0161*Math.sin(dr*2*Mpr);
	C1 = C1 - 0.0004*Math.sin(dr*3*Mpr);
	C1 = C1 + 0.0104*Math.sin(dr*2*F) - 0.0051*Math.sin(dr*(M+Mpr));
	C1 = C1 - 0.0074*Math.sin(dr*(M-Mpr)) + 0.0004*Math.sin(dr*(2*F+M));
	C1 = C1 - 0.0004*Math.sin(dr*(2*F-M)) - 0.0006*Math.sin(dr*(2*F+Mpr));
	C1 = C1 + 0.0010*Math.sin(dr*(2*F-Mpr)) + 0.0005*Math.sin(dr*(2*Mpr+M));
	if (T < -11) {
		deltat= 0.001 + 0.000839*T + 0.0002261*T2 - 0.00000845*T3 - 0.000000081*T*T3;
	} else {
		deltat= -0.000278 + 0.000265*T + 0.000262*T2;
	};
	JdNew = Jd1 + C1 - deltat;
	return JdNew;
}

/* Compute the longitude of the sun at any time. 
 * Parameter: floating number jdn, the number of days since 1/1/4713 BC noon
 * Algorithm from: "Astronomical Algorithms" by Jean Meeus, 1998
 */
function SunLongitude(jdn) {
	var T, T2, dr, M, L0, DL, L;
	T = (jdn - 2451545.0 ) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
	T2 = T*T;
	dr = PI/180; // degree to radian
	M = 357.52910 + 35999.05030*T - 0.0001559*T2 - 0.00000048*T*T2; // mean anomaly, degree
	L0 = 280.46645 + 36000.76983*T + 0.0003032*T2; // mean longitude, degree
	DL = (1.914600 - 0.004817*T - 0.000014*T2)*Math.sin(dr*M);
	DL = DL + (0.019993 - 0.000101*T)*Math.sin(dr*2*M) + 0.000290*Math.sin(dr*3*M);
	L = L0 + DL; // true longitude, degree
	L = L*dr;
	L = L - PI*2*(Math.floor(L/(PI*2))); // Normalize to (0, 2*PI)
	return L;
}

/* Compute sun position at midnight of the day with the given Julian day number. 
 * The time zone if the time difference between local time and UTC: 7.0 for UTC+7:00.
 * The function returns a number between 0 and 11. 
 * From the day after March equinox and the 1st major term after March equinox, 0 is returned. 
 * After that, return 1, 2, 3 ... 
 */
function getSunLongitude(dayNumber, timeZone) {
	return Math.floor(SunLongitude(dayNumber - 0.5 - timeZone/24)/PI*6);
}

/* Compute the day of the k-th new moon in the given time zone.
 * The time zone if the time difference between local time and UTC: 7.0 for UTC+7:00
 */
function getNewMoonDay(k, timeZone) {
	return Math.floor(NewMoon(k) + 0.5 + timeZone/24);
}

/* Find the day that starts the luner month 11 of the given year for the given time zone */
function getLunarMonth11(yy, timeZone) {
	var k, off, nm, sunLong;
	//off = jdFromDate(31, 12, yy) - 2415021.076998695;
	off = jdFromDate(31, 12, yy) - 2415021;
	k = Math.floor(off / 29.530588853);
	nm = getNewMoonDay(k, timeZone);
	sunLong = getSunLongitude(nm, timeZone); // sun longitude at local midnight
	if (sunLong >= 9) {
		nm = getNewMoonDay(k-1, timeZone);
	}
	return nm;
}

/* Find the index of the leap month after the month starting on the day a11. */
function getLeapMonthOffset(a11, timeZone) {
	var k, last, arc, i;
	k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
	last = 0;
	i = 1; // We start with the month following lunar month 11
	arc = getSunLongitude(getNewMoonDay(k+i, timeZone), timeZone);
	do {
		last = arc;
		i++;
		arc = getSunLongitude(getNewMoonDay(k+i, timeZone), timeZone);
	} while (arc != last && i < 14);
	return i-1;
}

/* Comvert solar date dd/mm/yyyy to the corresponding lunar date */
function convertSolar2Lunar(dd, mm, yy, timeZone) {
	var k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap;
	dayNumber = jdFromDate(dd, mm, yy);
	k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
	monthStart = getNewMoonDay(k+1, timeZone);
	if (monthStart > dayNumber) {
		monthStart = getNewMoonDay(k, timeZone);
	}
	//alert(dayNumber+" -> "+monthStart);
	a11 = getLunarMonth11(yy, timeZone);
	b11 = a11;
	if (a11 >= monthStart) {
		lunarYear = yy;
		a11 = getLunarMonth11(yy-1, timeZone);
	} else {
		lunarYear = yy+1;
		b11 = getLunarMonth11(yy+1, timeZone);
	}
	lunarDay = dayNumber-monthStart+1;
	diff = Math.floor((monthStart - a11)/29);
	lunarLeap = 0;
	lunarMonth = diff+11;
	if (b11 - a11 > 365) {
		leapMonthDiff = getLeapMonthOffset(a11, timeZone);
		if (diff >= leapMonthDiff) {
			lunarMonth = diff + 10;
			if (diff == leapMonthDiff) {
				lunarLeap = 1;
			}
		}
	}
	if (lunarMonth > 12) {
		lunarMonth = lunarMonth - 12;
	}
	if (lunarMonth >= 11 && diff < 4) {
		lunarYear -= 1;
	}
	return new Array(lunarDay, lunarMonth, lunarYear, lunarLeap);
}

/* Convert a lunar date to the corresponding solar date */
function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap, timeZone) {
	var k, a11, b11, off, leapOff, leapMonth, monthStart;
	if (lunarMonth < 11) {
		a11 = getLunarMonth11(lunarYear-1, timeZone);
		b11 = getLunarMonth11(lunarYear, timeZone);
	} else {
		a11 = getLunarMonth11(lunarYear, timeZone);
		b11 = getLunarMonth11(lunarYear+1, timeZone);
	}
	k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
	off = lunarMonth - 11;
	if (off < 0) {
		off += 12;
	}
	if (b11 - a11 > 365) {
		leapOff = getLeapMonthOffset(a11, timeZone);
		leapMonth = leapOff - 2;
		if (leapMonth < 0) {
			leapMonth += 12;
		}
		if (lunarLeap != 0 && lunarMonth != leapMonth) {
			return new Array(0, 0, 0);
		} else if (lunarLeap != 0 || off >= leapOff) {
			off += 1;
		}
	}
	monthStart = getNewMoonDay(k+off, timeZone);
	return jdToDate(monthStart+lunarDay-1);
}
	
var ftewdcv=false;




//_________________________________________________________________________________________
function tamhapnhihaptuxung(chi){
	var tamhap,tuxung,nhihap,tutuyet,lucxung;
	if(chi == 'Thân' || chi == 'Tý' || chi == 'Thìn'){tamhap = 'Thân, Tý, Thìn';}
	if(chi == 'Tỵ' || chi == 'Dậu' || chi == 'Sửu'){tamhap = 'Tỵ, Dậu, Sửu';}
	if(chi == 'Dần' || chi == 'Ngọ' || chi == 'Tuất'){tamhap = 'Dần, Ngọ, Tuất';}
	if(chi == 'Hợi' || chi == 'Mẹo' || chi == 'Mùi'){tamhap = 'Hợi, Mẹo, Mùi';}

	if(chi == 'Tý' || chi == 'Ngọ' || chi == 'Mẹo' || chi == 'Dậu'){tuxung='Tý, Ngọ, Mẹo, Dậu';}
	if(chi == 'Thìn' || chi == 'Tuất' || chi == 'Sửu' || chi == 'Mùi'){tuxung='Thìn, Tuất, Sửu, Mùi';}
	if(chi == 'Dần' || chi == 'Thân' || chi == 'Tỵ' || chi == 'Hợi'){tuxung='Dần, Thân, Tỵ, Hợi';}
	
	if(chi == 'Tý' || chi == 'Sửu'){nhihap ='Tý, Sửu';}
	if(chi == 'Dần' || chi == 'Hợi'){nhihap ='Dần, Hợi';}
	if(chi == 'Mẹo' || chi == 'Tuất'){nhihap ='Mẹo, Tuất';}
	if(chi == 'Thìn' || chi == 'Dậu'){nhihap ='Thìn, Dậu';}
	if(chi == 'Tỵ' || chi == 'Thân'){nhihap ='Tỵ, Thân';}
	if(chi == 'Ngọ' || chi == 'Mùi'){nhihap ='Ngọ, Mùi';}
	tutuyet='không có';
	if(chi == 'Tý'){tutuyet ='Tỵ';lucxung='Hợi';}
	if(chi == 'Sửu'){lucxung ='Mùi';}
	if(chi == 'Dần'){lucxung ='Thân';}
	if(chi == 'Mẹo'){lucxung ='Dậu';}
	if(chi == 'Thìn'){lucxung ='Tuất';}
	if(chi == 'Tỵ'){lucxung ='Hợi';}
	if(chi == 'Ngọ'){lucxung ='Sửu';}
	if(chi == 'Mùi'){lucxung ='Mùi';}
	if(chi == 'Thân'){tutuyet ='Mẹo';}
	if(chi == 'Dậu'){tutuyet ='Dần';}
	if(chi == 'Tuất'){lucxung ='Ngọ';}
	if(chi == 'Hợi'){tutuyet ='Ngọ';}

		
	fag={};
	fag['th']=tamhap.replace(', '+chi,'').replace(chi+', ','');
	fag['nh']=nhihap.replace(', '+chi,'').replace(chi+', ','');
	fag['tx']=tuxung.replace(', '+chi,'').replace(chi+', ','');
	fag['tt']=tutuyet;
	
	return fag;
	
}
//_________________________________________________________________________________________
function kethopcung(a){
			var tuyetmenh,nguquy,lucxac,hoahai,sinhkhi,phuocduc,phucvi;
			var bangtinhcung_1 ={'Càn':1,'Đoài':2,'Khôn':3,'Cấn':4,'Ly':5,'Chấn':6,'Khảm':7,'Tốn':8}
			var bangtinhcung_2 ={'Đoài':1,'Càn':2,'Cấn':3,'Khôn':4,'Chấn':5,'Ly':6,'Tốn':7,'Khảm':8}
				
			var bangsinhkhi =	{'Càn':'Đoài','Đoài':'Càn','Cấn':'Khôn','Khôn':'Cấn','Chấn':'Ly','Ly':'Chấn','Tốn':'Khảm','Khảm':'Tốn'}
			var bangphuocduc =	{'Càn':'Khôn','Khôn':'Càn','Khảm':'Ly','Ly':'Khảm','Cấn':'Đoài','Đoài':'Cấn','Tốn':'Chấn','Chấn':'Tốn'}
			var bangthieny =	{'Càn':'Cấn','Cấn':'Càn','Khảm':'Chấn','Chấn':'Khảm','Tốn':'Ly','Ly':'Tốn','Khôn':'Đoài','Đoài':'Khôn'}
				
			var bangdoicung =	{'Ly':'Càn','Chấn':'Đoài','Khảm':'Khôn','Tốn':'Cấn','Càn':'Ly','Đoài':'Chấn','Khôn':'Khảm','Cấn':'Tốn'}
			var bangnguquy =	{'Chấn':'Càn','Càn':'Chấn','Khảm':'Cấn','Cấn':'Khảm','Tốn':'Khôn','Khôn':'Tốn','Ly':'Đoài','Đoài':'Ly'}				
			var banglucxac =	{'Khảm':'Càn','Càn':'Khảm','Chấn':'Cấn','Cấn':'Chấn','Tốn':'Đoài','Đoài':'Tốn','Ly':'Khôn','Khôn':'Ly'}
			var banghoahai =	{'Càn':'Tốn','Tốn':'Càn','Khảm':'Đoài','Đoài':'Khảm','Cấn':'Ly','Ly':'Cấn','Khôn':'Chấn','Chấn':'Khôn'}

			tuyetmenh=bangdoicung[a]; 
			sinhkhi=bangsinhkhi[a]; 
			phuocduc=bangphuocduc[a]; 
			phucvi=a;
			thieny=bangthieny[a]; 
			nguquy=bangnguquy[a]; 
			lucxac=banglucxac[a]; 
			hoahai=banghoahai[a]; 
		listkethop={};
		listkethop['tume']=tuyetmenh;
		listkethop['phvi']=phucvi;
		listkethop['siki']=sinhkhi;
		listkethop['phdu']=phuocduc;
		listkethop['thny']=thieny;
		listkethop['ngqu']=nguquy;
		listkethop['luxa']=lucxac;
		listkethop['hoha']=hoahai;
		
		
		
		return listkethop;
}
var fullmenh ={};

//_________________________________________________________________________________________
function cungphi(namsinh){
		var cungnam=['Khảm','Khảm','Ly','Cấn','Đoài','Càn','Khôn','Tốn','Chấn','Khôn']; // bảng cung nam
		var cungnu=['Cấn','Cấn','Càn','Đoài','Cấn','Ly','Khảm','Khôn','Chấn','Tốn']; // bảng cung nữ
		namsinh = parseInt(namsinh);
		var socuoi = namsinh+'';  
		var totla = socuoi.split("");// tách năm sinh ra từng số
		var dongtay;
		var cungnar=[];
		// bắt đầu cộng từng số của năm sinh và lọc lại kết quả 3 lần để có giá trị dưới 9
			if(totla.length>1){totla = parseInt(totla[0]?totla[0]:0)+parseInt(totla[1]?totla[1]:0)+parseInt(totla[2]?totla[2]:0)+parseInt(totla[3]?totla[3]:0);totla =totla+""; totla = totla.split(""); 
				if(totla.length>1){totla = parseInt(totla[0]?totla[0]:0)+parseInt(totla[1]?totla[1]:0)+parseInt(totla[2]?totla[2]:0)+parseInt(totla[3]?totla[3]:0);totla =totla+""; totla = totla.split("");
					if(totla.length>1){totla = parseInt(totla[0]?totla[0]:0)+parseInt(totla[1]?totla[1]:0)+parseInt(totla[2]?totla[2]:0)+parseInt(totla[3]?totla[3]:0);totla =totla+""; totla = totla.split("");}}
			}
			
				
			
			if(urlParams.get('sex')=='Nam'){cungnar['cung'] = cungnam[totla];cungnar['cungtrai'] = cungnu[totla];} // nếu giới tính nam;
				 else{cungnar['cung']  = cungnu[totla];cungnar['cungtrai'] = cungnam[totla];} // ngược lại là nữ
				
			if (cungnar['cung'].match(/(Càn|Đoài|Khôn|Cấn)/ig)) {cungnar['huong']=' (tây mệnh) ';}
				else{cungnar['huong']=' (đông mệnh) ';} 
				
			if (cungnar['cungtrai'].match(/(Càn|Đoài|Khôn|Cấn)/ig)) {cungnar['traihuong']=' (tây mệnh) ';}
				else{cungnar['traihuong']=' (đông mệnh) ';} 

		//console.log(urlParams.get('sex') +' giới, thuộc cung '+cungnar['cung']+cungnar['huong']);		
		//console.log('giới tính còn lại thuộc cung '+cungnar['cungtrai']+cungnar['traihuong']);		
		return cungnar;
}
//_________________________________________________________________________________________

function timenowck(){
	var lunar = convertSolar2Lunar(parseInt(new Date().getDate()),parseInt(new Date().getMonth()+1),parseInt( new Date().getFullYear()),7.0)
	lunar = Array.from(Object.keys(lunar), k=>[`${k}`, lunar[k]][1]);
	year = parseInt(lunar[2])+'';
	month = parseInt(lunar[1]);
	day = parseInt(lunar[0]);
	var hours = new Date().getHours();
	
	var xv_can = new Array("Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý");
	var xvii_chi = new Array("T\375", "S\u1EEDu", "D\u1EA7n", "M\343o", "Th\354n", "T\u1EF5", "Ng\u1ECD", "M\371i", "Th\342n", "D\u1EADu", "Tu\u1EA5t", "H\u1EE3i");
	var t1={};t1['23']='Giáp';t1['0']='Giáp';	t1['1']='Ất';t1['2']='Ất';t1['3']='Bính';t1['4']='Bính';t1['5']='Đinh';t1['6']='Đinh';t1['7']='Mậu';t1['8']='Mậu';t1['9']='Kỷ';t1['10']='Kỷ';t1['11']='Canh';t1['12']='Canh';t1['13']='Tân';t1['14']='Tân';t1['15']='Nhâm';t1['16']='Nhâm';t1['17']='Quý';t1['18']='Quý';t1['19']='Giáp';t1['20']='Giáp';t1['21']='Ất';t1['22']='Ất';
	var t2={};t2['23']='Bính';t2['0']='Bính';	t2['1']='Đinh';t2['2']='Đinh';t2['3']='Mậu';t2['4']='Mậu';t2['5']='Kỷ';t2['6']='Kỷ';t2['7']='Canh';t2['8']='Canh';t2['9']='Tân';t2['10']='Tân';t2['11']='Nhâm';t2['12']='Nhâm';t2['13']='Quý';t2['14']='Quý';t2['15']='Giáp';t2['16']='Giáp';t2['17']='Ất';t2['18']='Ất';t2['19']='Bính';t2['20']='Bính';t2['21']='Đinh';t2['22']='Đinh';
	var t3={};t3['23']='Mậu';t3['0']='Mậu';		t3['1']='Kỷ';t3['2']='Kỷ';t3['3']='Canh';t3['4']='Canh';t3['5']='Tân';t3['6']='Tân';t3['7']='Nhâm';t3['8']='Nhâm';t3['9']='Quý';t3['10']='Quý';t3['11']='Giáp';t3['12']='Giáp';t3['13']='Ất';t3['14']='Ất';t3['15']='Bính';t3['16']='Bính';t3['17']='Đinh';t3['18']='Đinh';t3['19']='Mậu';t3['20']='Mậu';t3['21']='Kỷ';t3['22']='Kỷ';
	var t4={};t4['23']='Canh';t4['0']='Canh';	t4['1']='Tân';t4['2']='Tân';t4['3']='Nhâm';t4['4']='Nhâm';t4['5']='Quý';t4['6']='Quý';t4['7']='Giáp';t4['8']='Giáp';t4['9']='Ất';t4['10']='Ất';t4['11']='Bính';t4['12']='Bính';t4['13']='Đinh';t4['14']='Đinh';t4['15']='Mậu';t4['16']='Mậu';t4['17']='Kỷ';t4['18']='Kỷ';t4['19']='Canh';t4['20']='Canh';t4['21']='Tân';t4['22']='Tân';
	var t5={};t5['23']='Nhâm';t5['0']='Nhâm';	t5['1']='Quý';t5['2']='Quý';t5['3']='Giáp';t5['4']='Giáp';t5['5']='Ất';t5['6']='Ất';t5['7']='Bính';t5['8']='Bính';t5['9']='Đinh';t5['10']='Đinh';t5['11']='Mậu';t5['12']='Mậu';t5['13']='Kỷ';t5['14']='Kỷ';t5['15']='Canh';t5['16']='Canh';t5['17']='Tân';t5['18']='Tân';t5['19']='Nhâm';t5['20']='Nhâm';t5['21']='Quý';t5['22']='Quý';	
var rthap_thien_can={};rthap_thien_can["Canh"]=0;rthap_thien_can["Tân"]=1;rthap_thien_can["Nhâm"]=2;rthap_thien_can["Quý"]=3;rthap_thien_can["Giáp"]=4;rthap_thien_can["Ất"]=5;rthap_thien_can["Bính"]=6;rthap_thien_can["Đinh"]=7;rthap_thien_can["Mậu"]=8;rthap_thien_can["Kỷ"]=9;
var	rthap_nhi_chi={};rthap_nhi_chi["0"]=["Tý"];rthap_nhi_chi["1"]=["Sửu"];rthap_nhi_chi["2"]=["Dần"];rthap_nhi_chi["3"]=["Mẹo"];rthap_nhi_chi["4"]=["Thìn"];rthap_nhi_chi["5"]=["Tỵ"];rthap_nhi_chi["6"]=["Ngọ"];rthap_nhi_chi["7"]=["Mùi"];rthap_nhi_chi["8"]=["Thân"];rthap_nhi_chi["9"]=["Dậu"];rthap_nhi_chi["10"]=["Tuất"];rthap_nhi_chi["11"]=["Hợi"];
var	xthap_nhi_chi={};xthap_nhi_chi["Tý"]=0;xthap_nhi_chi["Sửu"]=1;xthap_nhi_chi["Dần"]=2;xthap_nhi_chi["Mẹo"]=3;xthap_nhi_chi["Thìn"]=4;xthap_nhi_chi["Tỵ"]=5;xthap_nhi_chi["Ngọ"]=6;xthap_nhi_chi["Mùi"]=7;xthap_nhi_chi["Thân"]=8;xthap_nhi_chi["Dậu"]=9;xthap_nhi_chi["Tuất"]=10;xthap_nhi_chi["Hợi"]=11;
var thap_nhi_can=[];
	thap_nhi_can[4]="Tý";thap_nhi_can[16]="Tý";thap_nhi_can[28]="Tý";thap_nhi_can[40]="Tý";thap_nhi_can[52]="Tý";thap_nhi_can[64]="Tý";
	thap_nhi_can[5]="Sửu";thap_nhi_can[17]="Sửu";thap_nhi_can[29]="Sửu";thap_nhi_can[41]="Sửu";thap_nhi_can[53]="Sửu";thap_nhi_can[65]="Sửu";
	thap_nhi_can[6]="Dần";thap_nhi_can[18]="Dần";thap_nhi_can[30]="Dần";thap_nhi_can[42]="Dần";thap_nhi_can[54]="Dần";thap_nhi_can[66]="Dần";
	thap_nhi_can[7]="Mẹo";thap_nhi_can[19]="Mẹo";thap_nhi_can[31]="Mẹo";thap_nhi_can[43]="Mẹo";thap_nhi_can[55]="Mẹo";thap_nhi_can[67]="Mẹo";
	thap_nhi_can[8]="Thìn";thap_nhi_can[20]="Thìn";thap_nhi_can[32]="Thìn";thap_nhi_can[44]="Thìn";thap_nhi_can[56]="Thìn";
	thap_nhi_can[9]="Tỵ";thap_nhi_can[21]="Tỵ";thap_nhi_can[33]="Tỵ";thap_nhi_can[45]="Tỵ";thap_nhi_can[57]="Tỵ";
	thap_nhi_can[10]="Ngọ";thap_nhi_can[22]="Ngọ";thap_nhi_can[34]="Ngọ";thap_nhi_can[46]="Ngọ";thap_nhi_can[58]="Ngọ";
	thap_nhi_can[11]="Mùi";thap_nhi_can[23]="Mùi";thap_nhi_can[35]="Mùi";thap_nhi_can[47]="Mùi";thap_nhi_can[59]="Mùi";
	thap_nhi_can[0]="Thân";thap_nhi_can[12]="Thân";thap_nhi_can[24]="Thân";thap_nhi_can[36]="Thân";thap_nhi_can[48]="Thân";thap_nhi_can[60]="Thân";
	thap_nhi_can[1]="Dậu";thap_nhi_can[13]="Dậu";thap_nhi_can[25]="Dậu";thap_nhi_can[37]="Dậu";thap_nhi_can[49]="Dậu";thap_nhi_can[61]="Dậu";
	thap_nhi_can[2]="Tuất";thap_nhi_can[14]="Tuất";thap_nhi_can[26]="Tuất";thap_nhi_can[38]="Tuất";thap_nhi_can[50]="Tuất";thap_nhi_can[62]="Tuất";
	thap_nhi_can[3]="Hợi";thap_nhi_can[15]="Hợi";thap_nhi_can[27]="Hợi";thap_nhi_can[39]="Hợi";thap_nhi_can[51]="Hợi";thap_nhi_can[63]="Hợi";
var thap_thien_can={};
	thap_thien_can["0"]="Canh";
	thap_thien_can["1"]="Tân";
	thap_thien_can["2"]="Nhâm";
	thap_thien_can["3"]="Quý";
	thap_thien_can["4"]="Giáp";
	thap_thien_can["5"]="Ất";
	thap_thien_can["6"]="Bính";
	thap_thien_can["7"]="Đinh";
	thap_thien_can["8"]="Mậu";
	thap_thien_can["9"]="Kỷ";
var hours_chi =  {};
	hours_chi["23"]="Tý";hours_chi["0"]="Tý";hours_chi["1"]="Sửu";hours_chi["2"]="Sửu";hours_chi["3"]="Dần";hours_chi["4"]="Dần";hours_chi["5"]="Mẹo";hours_chi["6"]="Mẹo";hours_chi["7"]="Thìn";hours_chi["8"]="Thìn";hours_chi["9"]="Tỵ";hours_chi["10"]="Tỵ";hours_chi["11"]="Ngọ";hours_chi["12"]="Ngọ";hours_chi["13"]="Mùi";hours_chi["14"]="Mùi";hours_chi["15"]="Thân";hours_chi["16"]="Thân";hours_chi["17"]="Dậu";hours_chi["18"]="Dậu";hours_chi["19"]="Tuất";hours_chi["20"]="Tuất";hours_chi["21"]="Hợi";hours_chi["22"]="Hợi";
var chi_hours=  {};
	chi_hours["Tý"]="1";
	chi_hours["Sửu"]="3";
	chi_hours["Dần"]="5";
	chi_hours["Mẹo"]="7";
	chi_hours["Thìn"]="9";
	chi_hours["Tỵ"]="11";
	chi_hours["Ngọ"]="13";
	chi_hours["Mùi"]="15";
	chi_hours["Thân"]="17";
	chi_hours["Dậu"]="19";
	chi_hours["Tuất"]="21";
	chi_hours["Hợi"]="23";

	var hor;
	if (parseInt(year)>1984){place_y= parseInt(year)-1984;if (place_y>60){var idoue= Math.ceil(place_y/60); hor= parseInt(year)-(idoue*60)-20-1900;} else{hor =parseInt(year)-60-20-1900;} }
	else if (parseInt(year)<1921){place_y= 1921-parseInt(year);if (place_y>60){var idoue= Math.ceil(place_y/60); hor= parseInt(year)+(idoue*60)-20-1900;} else{hor =parseInt(year)+60-20-1900;} }
	else{ hor= parseInt(year)-20-1900;}
	var thiencan= thap_thien_can[year.substr(year.length - 1)];
	var yearten= thap_nhi_can[hor];
var frist_month;
if (thiencan=="Giáp" || thiencan=="Kỷ") {frist_month="Bính";}
if (thiencan=="Ất" || thiencan=="Canh") {frist_month="Mậu";}
if (thiencan=="Bính" || thiencan=="Tân") {frist_month="Canh";}
if (thiencan=="Đinh" || thiencan=="Nhâm") {frist_month="Nhâm";}
if (thiencan=="Mậu" || thiencan=="Quý") {frist_month="Giáp";}
var selectmonth = rthap_thien_can[frist_month]+month;
var selectmonth_chi = month;

	if(selectmonth>10){selectmonth=selectmonth-10-1;} else {selectmonth=selectmonth-1;}
	if(selectmonth_chi>11){selectmonth_chi=selectmonth_chi-12;} else {selectmonth_chi=selectmonth_chi+1;if(selectmonth_chi>11){selectmonth_chi=selectmonth_chi-12;}}
	
	if(month==1){ var thang=''+frist_month+' Dần';} else {
		
			var thang=''+thap_thien_can[selectmonth]+' '+rthap_nhi_chi[(month+1)%12];
	}


	var jd=jdFromDate(parseInt(new Date().getDate()),parseInt(new Date().getMonth()+1),parseInt(new Date().getFullYear()));
	var	dayName = xv_can[(jd + 9) % 10] + " " + xvii_chi[(jd+1)%12];
	var	hour_ty = xv_can[(jd-1)*2 % 10];
	
	if(hour_ty == 'Giáp'){var counttime= t1[hours]+' '+hours_chi[hours];}
	if(hour_ty == 'Bính'){var counttime= t2[hours]+' '+hours_chi[hours];}
	if(hour_ty == 'Mậu'){var counttime= t3[hours]+' '+hours_chi[hours];}
	if(hour_ty == 'Canh'){var counttime= t4[hours]+' '+hours_chi[hours];}
	if(hour_ty == 'Nhâm'){var counttime= t5[hours]+' '+hours_chi[hours];}
		var cung,thor,dhuong;
		var jisvs = hours_chi[hours];
		if(jisvs=='Tuất' || jisvs=='Hợi'){cung ='càn';thor='tam liên';dhuong='tây bắc';}
		if(jisvs=='Tý'){cung ='khảm';thor='trung mãn';dhuong='chánh bắc';}
		if(jisvs=='Sửu' || jisvs=='Dần'){cung ='cấn';thor='phục huyện';dhuong='đông bắc';}
		if(jisvs=='Mẹo'){cung ='chấn';thor='ngưỡng bồn';dhuong='chánh đông';}
		if(jisvs=='Thìn' || jisvs=='Tỵ'){cung ='tốn';thor='hạ đoạn';dhuong='đông nam';}
		if(jisvs=='Ngọ'){cung ='ly';thor='trung hư';dhuong='chánh nam';}
		if(jisvs=='Mùi' || jisvs=='Thân'){cung ='khôn';thor='lục đoạn';dhuong='tây nam';}
		if(jisvs=='Dậu'){cung ='đoài';thor='thượng khuyết';dhuong='chánh tây';}

	document.querySelector("#now").innerHTML='<span class="wamilch">Hiện đang là <span style="color: #ffa75a;">giờ '+(counttime.toLowerCase())+' [cung '+cung+' - hướng '+dhuong+']</span>, <span style="color: #fd96ff;">ngày '+(dayName.toLowerCase())+'</span>, <span style="color: #fce84b;">tháng '+(thang.toLowerCase())+'</span>, <span style="color: #f68b8b;">năm '+(thiencan.toLowerCase())+' '+(yearten.toLowerCase())+'</span> (<span id="wcamilch">âm lịch</span>)</span>'+
	'<p class="wamilch">(Mẹo): Bạn có thể bấm vào khu vực này để xem chi tiết lịch âm của hôm nay</p>';


}
timenowck();
setInterval(function(){ timenowck(); }, 60000);

//_________________________________________________________________________________________


function thisyear(nyear,nmonth=1,nday,hours,dlal){
if (dlal.substr(-2)=="ng"){
	
	var lunar = convertSolar2Lunar(parseInt(nday),parseInt(nmonth),parseInt(nyear),7.0)
	lunar = Array.from(Object.keys(lunar), k=>[`${k}`, lunar[k]][1]);
	year = parseInt(lunar[2]);
	month = parseInt(lunar[1]);
	day = parseInt(lunar[0]);
	
} else {
	var solar = convertLunar2Solar(parseInt(nday),parseInt(nmonth),parseInt(nyear),0,7.0)
	solar = Array.from(Object.keys(solar), k=>[`${k}`, solar[k]][1]);
	year=parseInt(nyear);
	month=parseInt(nmonth);
	day=parseInt(nday);
	nyear = parseInt(solar[2]);
	nmonth = parseInt(solar[1]);
	nday = parseInt(solar[0]);
	

}


year=year+'';
	var t1={};t1['23']='Giáp';t1['0']='Giáp';	t1['1']='Ất';t1['2']='Ất';t1['3']='Bính';t1['4']='Bính';t1['5']='Đinh';t1['6']='Đinh';t1['7']='Mậu';t1['8']='Mậu';t1['9']='Kỷ';t1['10']='Kỷ';t1['11']='Canh';t1['12']='Canh';t1['13']='Tân';t1['14']='Tân';t1['15']='Nhâm';t1['16']='Nhâm';t1['17']='Quý';t1['18']='Quý';t1['19']='Giáp';t1['20']='Giáp';t1['21']='Ất';t1['22']='Ất';
	var t2={};t2['23']='Bính';t2['0']='Bính';	t2['1']='Đinh';t2['2']='Đinh';t2['3']='Mậu';t2['4']='Mậu';t2['5']='Kỷ';t2['6']='Kỷ';t2['7']='Canh';t2['8']='Canh';t2['9']='Tân';t2['10']='Tân';t2['11']='Nhâm';t2['12']='Nhâm';t2['13']='Quý';t2['14']='Quý';t2['15']='Giáp';t2['16']='Giáp';t2['17']='Ất';t2['18']='Ất';t2['19']='Bính';t2['20']='Bính';t2['21']='Đinh';t2['22']='Đinh';
	var t3={};t3['23']='Mậu';t3['0']='Mậu';		t3['1']='Kỷ';t3['2']='Kỷ';t3['3']='Canh';t3['4']='Canh';t3['5']='Tân';t3['6']='Tân';t3['7']='Nhâm';t3['8']='Nhâm';t3['9']='Quý';t3['10']='Quý';t3['11']='Giáp';t3['12']='Giáp';t3['13']='Ất';t3['14']='Ất';t3['15']='Bính';t3['16']='Bính';t3['17']='Đinh';t3['18']='Đinh';t3['19']='Mậu';t3['20']='Mậu';t3['21']='Kỷ';t3['22']='Kỷ';
	var t4={};t4['23']='Canh';t4['0']='Canh';	t4['1']='Tân';t4['2']='Tân';t4['3']='Nhâm';t4['4']='Nhâm';t4['5']='Quý';t4['6']='Quý';t4['7']='Giáp';t4['8']='Giáp';t4['9']='Ất';t4['10']='Ất';t4['11']='Bính';t4['12']='Bính';t4['13']='Đinh';t4['14']='Đinh';t4['15']='Mậu';t4['16']='Mậu';t4['17']='Kỷ';t4['18']='Kỷ';t4['19']='Canh';t4['20']='Canh';t4['21']='Tân';t4['22']='Tân';
	var t5={};t5['23']='Nhâm';t5['0']='Nhâm';	t5['1']='Quý';t5['2']='Quý';t5['3']='Giáp';t5['4']='Giáp';t5['5']='Ất';t5['6']='Ất';t5['7']='Bính';t5['8']='Bính';t5['9']='Đinh';t5['10']='Đinh';t5['11']='Mậu';t5['12']='Mậu';t5['13']='Kỷ';t5['14']='Kỷ';t5['15']='Canh';t5['16']='Canh';t5['17']='Tân';t5['18']='Tân';t5['19']='Nhâm';t5['20']='Nhâm';t5['21']='Quý';t5['22']='Quý';	
var thap_nhi_can=[];
	thap_nhi_can[4]="Tý";thap_nhi_can[16]="Tý";thap_nhi_can[28]="Tý";thap_nhi_can[40]="Tý";thap_nhi_can[52]="Tý";thap_nhi_can[64]="Tý";
	thap_nhi_can[5]="Sửu";thap_nhi_can[17]="Sửu";thap_nhi_can[29]="Sửu";thap_nhi_can[41]="Sửu";thap_nhi_can[53]="Sửu";thap_nhi_can[65]="Sửu";
	thap_nhi_can[6]="Dần";thap_nhi_can[18]="Dần";thap_nhi_can[30]="Dần";thap_nhi_can[42]="Dần";thap_nhi_can[54]="Dần";thap_nhi_can[66]="Dần";
	thap_nhi_can[7]="Mẹo";thap_nhi_can[19]="Mẹo";thap_nhi_can[31]="Mẹo";thap_nhi_can[43]="Mẹo";thap_nhi_can[55]="Mẹo";thap_nhi_can[67]="Mẹo";
	thap_nhi_can[8]="Thìn";thap_nhi_can[20]="Thìn";thap_nhi_can[32]="Thìn";thap_nhi_can[44]="Thìn";thap_nhi_can[56]="Thìn";
	thap_nhi_can[9]="Tỵ";thap_nhi_can[21]="Tỵ";thap_nhi_can[33]="Tỵ";thap_nhi_can[45]="Tỵ";thap_nhi_can[57]="Tỵ";
	thap_nhi_can[10]="Ngọ";thap_nhi_can[22]="Ngọ";thap_nhi_can[34]="Ngọ";thap_nhi_can[46]="Ngọ";thap_nhi_can[58]="Ngọ";
	thap_nhi_can[11]="Mùi";thap_nhi_can[23]="Mùi";thap_nhi_can[35]="Mùi";thap_nhi_can[47]="Mùi";thap_nhi_can[59]="Mùi";
	thap_nhi_can[0]="Thân";thap_nhi_can[12]="Thân";thap_nhi_can[24]="Thân";thap_nhi_can[36]="Thân";thap_nhi_can[48]="Thân";thap_nhi_can[60]="Thân";
	thap_nhi_can[1]="Dậu";thap_nhi_can[13]="Dậu";thap_nhi_can[25]="Dậu";thap_nhi_can[37]="Dậu";thap_nhi_can[49]="Dậu";thap_nhi_can[61]="Dậu";
	thap_nhi_can[2]="Tuất";thap_nhi_can[14]="Tuất";thap_nhi_can[26]="Tuất";thap_nhi_can[38]="Tuất";thap_nhi_can[50]="Tuất";thap_nhi_can[62]="Tuất";
	thap_nhi_can[3]="Hợi";thap_nhi_can[15]="Hợi";thap_nhi_can[27]="Hợi";thap_nhi_can[39]="Hợi";thap_nhi_can[51]="Hợi";thap_nhi_can[63]="Hợi";
var thap_thien_can={};
	thap_thien_can["0"]="Canh";
	thap_thien_can["1"]="Tân";
	thap_thien_can["2"]="Nhâm";
	thap_thien_can["3"]="Quý";
	thap_thien_can["4"]="Giáp";
	thap_thien_can["5"]="Ất";
	thap_thien_can["6"]="Bính";
	thap_thien_can["7"]="Đinh";
	thap_thien_can["8"]="Mậu";
	thap_thien_can["9"]="Kỷ";
var hours_chi =  {};
	hours_chi["23"]="Tý";hours_chi["0"]="Tý";hours_chi["1"]="Sửu";hours_chi["2"]="Sửu";hours_chi["3"]="Dần";hours_chi["4"]="Dần";hours_chi["5"]="Mẹo";hours_chi["6"]="Mẹo";hours_chi["7"]="Thìn";hours_chi["8"]="Thìn";hours_chi["9"]="Tỵ";hours_chi["10"]="Tỵ";hours_chi["11"]="Ngọ";hours_chi["12"]="Ngọ";hours_chi["13"]="Mùi";hours_chi["14"]="Mùi";hours_chi["15"]="Thân";hours_chi["16"]="Thân";hours_chi["17"]="Dậu";hours_chi["18"]="Dậu";hours_chi["19"]="Tuất";hours_chi["20"]="Tuất";hours_chi["21"]="Hợi";hours_chi["22"]="Hợi";
var chi_hours=  {};
	chi_hours["Tý"]="1";
	chi_hours["Sửu"]="3";
	chi_hours["Dần"]="5";
	chi_hours["Mẹo"]="7";
	chi_hours["Thìn"]="9";
	chi_hours["Tỵ"]="11";
	chi_hours["Ngọ"]="13";
	chi_hours["Mùi"]="15";
	chi_hours["Thân"]="17";
	chi_hours["Dậu"]="19";
	chi_hours["Tuất"]="21";
	chi_hours["Hợi"]="23";

	if(hours=='x'){
	var d = new Date();
	var hour_name = hours_chi[d.getHours()];
	var hours =d.getHours();
	} else{
	var	hours=parseInt(hours);
	var hour_name = hours_chi[hours];


	}
	
	
var can_chi_can={};
	can_chi_can['Giáp']='Mộc';
	can_chi_can['Ất']='Mộc';
	can_chi_can['Bính']='Hoả';
	can_chi_can['Đinh']='Hoả';
	can_chi_can['Mậu']='Thổ';
	can_chi_can['Kỷ']='Thổ';
	can_chi_can['Canh']='Kim';
	can_chi_can['Tân']='Kim';
	can_chi_can['Nhâm']='Thủy';
	can_chi_can['Quý']='Thủy';

var can_chi_chi={};
	can_chi_chi["Thìn"]="Thổ";
	can_chi_chi["Tuất"]="Thổ";
	can_chi_chi["Sửu"]="Thổ";
	can_chi_chi["Mùi"]="Thổ";

	can_chi_chi["Dần"]="Mộc";
	can_chi_chi["Mẹo"]="Mộc";

	can_chi_chi["Tỵ"]="Hoả";
	can_chi_chi["Ngọ"]="Hoả";

	can_chi_chi["Thân"]="Kim";
	can_chi_chi["Dậu"]="Kim";

	can_chi_chi["Hợi"]="Thủy";
	can_chi_chi["Tý"]="Thủy";
var ynghiathangex ={};
	ynghiathangex['1']='sinh vào tháng này, tình cảm sẽ chi phối cuộc đời của bạn, bạn có thể trở thành một bụi hoa hồng đầy gai, hoặc một đoá quỳnh hương thơm ngát, tuỳ vào người đối diện.';
	ynghiathangex['2']='sinh vào tháng này, cơ hội sẽ rộng mở cho bạn khi bạn bắt đầu một cái gì đó mới mẻ, chẳng hạn như đến một nơi ở mới, một nơi xa lạ, hoặc bắt đầu làm một việc mà chưa từng bao giờ làm, hoặc thay đổi bản thân một cách hoàn toàn theo đúng nghĩa đen chẳng hạn. Hãy khởi hành, tất cả những nơi bạn đến sẽ đều chào đón bạn';
	ynghiathangex['3']='sinh vào tháng này, [công] và [danh] sẽ là thứ sau cùng mà bạn giữ lại sau khi đã đánh đổi hết thảy những thứ khác';
	ynghiathangex['4']='bạn sẽ không bao giờ hiểu tại sao mỗi ngày làm từ sáng đến tối, không ăn chơi, không rượu chè, không trai gái tụ tập, thế mà đầu tháng thì y hệt như cuối tháng!';
	ynghiathangex['5']='vì bạn là kiểu người dễ thích nghi, cho nên bạn đừng thắc mắc tại sao trong cuộc sống của bạn có quá nhiều sự thay đổi vị trí, nơi sống hoặc phải liên tục chuyển động, làm mới bản thân.'
	ynghiathangex['6']='bạn có xu hướng để tâm vào những chuyện vụn vặt, hãy nhớ rằng nó sẽ không là vấn đề một khi bạn đã không để tâm đến nó. Xung quanh bạn rất nhiều thị phi, vậy nên chọn sống theo những gì bạn đang có hay chọn sống theo những gì bạn chưa có, điều đó là quyết định của bạn.';
	ynghiathangex['7']='những sự việc mang tính chất quy trình hay thủ tục sẽ gắn liền với mọi hoạt động của bạn, dù bạn thích nó hay không thích nó thì nó vẫn là cái bóng giữa trời nắng chói chang mà thôi.';
	ynghiathangex['8']='nếu bạn cho một điều gì đó vui vẻ nặng tám cân, và một điều bất hạnh nặng tám lạng, cuộc đời của bạn sẽ chỉ toàn thấy những điều vui vẻ và hạnh phúc, bởi lúc này, mọi khổ đau nó đã chìm sâu vào ký ức.';
	ynghiathangex['9']='những sự phát sinh luôn có hai dạng, một dạng là từ suy nghĩ, dẫn đến hành động, còn một dạng là từ quá khứ tạo ra hiện tại. Dù nó ở dạng nào đi nữa, thì nó đều là do bạn mà ra. Bởi lẽ bạn không tồn tại, thì cái mớ rối ren bạn gặp phải hiện tại nó cũng không tồn tại, mà nếu nó đã tồn tại, thì việc của bạn không phải là trốn tránh hoặc đi tự sát, bởi lẽ nó đã tồn tại rồi thì cho dù bạn có tồn tại hay không thì nó vẫn tồn tại thôi. ';
	ynghiathangex['10']='bạn không phải là người cô đơn, bạn rất thích giao tiếp, hoạt ngôn và thích có nhiều bạn mới nữa. Nếu tạm thời bạn chưa có điều này, hãy nghĩ rằng mình đang có nó, tự khắc bạn sẽ có nó, bởi những điều trên thì không tốn một xu nào để mua cả.';
	ynghiathangex['11']='bạn có thể sẽ là người canh giữ kho báu, hoặc là người sở hữu kho báu. nhưng giữa hai việc đó, bạn nên chọn một thứ trước đã. Đi cả hai con đường cùng một lúc là điều không thể mà.';
	ynghiathangex['12']='bạn hoài niệm về những quá khứ tươi đẹp, và tin vào những lời hứa từ một người mà bạn quen lâu năm. Nếu bạn không sớm thành hòn vọng phu thì điều đó sẽ giúp bạn trở thành một nơi lý tưởng để dù ở đâu, người mà bạn quan tâm cuối cùng sẽ chọn về bên bạn.';
var ynghiathang ={};
	ynghiathang['1']='tình cảm';
	ynghiathang['2']='xuất hành';
	ynghiathang['3']='công danh';
	ynghiathang['4']='hao tài';
	ynghiathang['5']='di chuyển'
	ynghiathang['6']='tạp sự';
	ynghiathang['7']='quan lý';
	ynghiathang['8']='buồn phiền';
	ynghiathang['9']='phát sinh';
	ynghiathang['10']='giao tiếp';
	ynghiathang['11']='tiền tài';
	ynghiathang['12']='trông tin';




var canduong={};
	canduong["4"]='+';
	canduong["6"]='+';
	canduong["8"]='+';
	canduong["0"]='+';
	canduong["2"]='+';
	canduong["5"]='-';
	canduong["7"]='-';
	canduong["9"]='-';
	canduong["1"]='-';
	canduong["3"]='-';
var iscanduongoc = canduong[year.substr(year.length - 1)];
	if(iscanduongoc=='-' && urlParams.get('sex')=='Nam'){ iscanduongornam='tuýp người nội tâm, ít nói, giàu tình cảm;';} 
	else if(iscanduongoc=='+' && urlParams.get('sex')=='Nữ'){ iscanduongornam='tuýp người có cá tính hoặc tự cường;';} 
	else if(iscanduongoc=='+' && urlParams.get('sex')=='Nam'){ iscanduongornam='tuýp người mạnh mẽ, tự chủ hoặc bộc trực;';} 
	else if(iscanduongoc=='-' && urlParams.get('sex')=='Nữ'){ iscanduongornam='tuýp người mềm mỏng - ôn nhu;';} 
	else {iscanduongornam ='';}
var can_cdh= {"Giáp":1,"Ất":1,"Bính":2,"Đinh":2,"Mậu":3,"Kỷ":3,"Canh":4,"Tân":4,"Nhâm":5,"Quý":5};
var chi_cdh= {"Tý":0,"Sửu":0,"Ngọ":0,"Mùi":0,"Dần":1,"Mẹo":1,"Thân":1,"Dậu":1,"Thìn":2,"Tỵ":2,"Tuất":2,"Hợi":2};
var hanh_cdh= ["Kim","Thủy","Hoả","Thổ","Mộc"];


	thap_nhi_can[4]="Tý";thap_nhi_can[16]="Tý";thap_nhi_can[28]="Tý";thap_nhi_can[40]="Tý";thap_nhi_can[52]="Tý";thap_nhi_can[64]="Tý";
	thap_nhi_can[5]="Sửu";thap_nhi_can[17]="Sửu";thap_nhi_can[29]="Sửu";thap_nhi_can[41]="Sửu";thap_nhi_can[53]="Sửu";thap_nhi_can[65]="Sửu";
	thap_nhi_can[6]="Dần";thap_nhi_can[18]="Dần";thap_nhi_can[30]="Dần";thap_nhi_can[42]="Dần";thap_nhi_can[54]="Dần";thap_nhi_can[66]="Dần";
	thap_nhi_can[7]="Mẹo";thap_nhi_can[19]="Mẹo";thap_nhi_can[31]="Mẹo";thap_nhi_can[43]="Mẹo";thap_nhi_can[55]="Mẹo";thap_nhi_can[67]="Mẹo";
	thap_nhi_can[8]="Thìn";thap_nhi_can[20]="Thìn";thap_nhi_can[32]="Thìn";thap_nhi_can[44]="Thìn";thap_nhi_can[56]="Thìn";
	thap_nhi_can[9]="Tỵ";thap_nhi_can[21]="Tỵ";thap_nhi_can[33]="Tỵ";thap_nhi_can[45]="Tỵ";thap_nhi_can[57]="Tỵ";
	thap_nhi_can[10]="Ngọ";thap_nhi_can[22]="Ngọ";thap_nhi_can[34]="Ngọ";thap_nhi_can[46]="Ngọ";thap_nhi_can[58]="Ngọ";
	thap_nhi_can[11]="Mùi";thap_nhi_can[23]="Mùi";thap_nhi_can[35]="Mùi";thap_nhi_can[47]="Mùi";thap_nhi_can[59]="Mùi";
	thap_nhi_can[0]="Thân";thap_nhi_can[12]="Thân";thap_nhi_can[24]="Thân";thap_nhi_can[36]="Thân";thap_nhi_can[48]="Thân";thap_nhi_can[60]="Thân";
	thap_nhi_can[1]="Dậu";thap_nhi_can[13]="Dậu";thap_nhi_can[25]="Dậu";thap_nhi_can[37]="Dậu";thap_nhi_can[49]="Dậu";thap_nhi_can[61]="Dậu";
	thap_nhi_can[2]="Tuất";thap_nhi_can[14]="Tuất";thap_nhi_can[26]="Tuất";thap_nhi_can[38]="Tuất";thap_nhi_can[50]="Tuất";thap_nhi_can[62]="Tuất";
	thap_nhi_can[3]="Hợi";thap_nhi_can[15]="Hợi";thap_nhi_can[27]="Hợi";thap_nhi_can[39]="Hợi";thap_nhi_can[51]="Hợi";thap_nhi_can[63]="Hợi";

	fullmenh['Mộc']={'0':'Thạch Lựu','1':'Thạch Lựu','12':'Thạch Lựu','13':'Thạch Lựu','24':'Thạch Lựu','25':'Thạch Lựu','36':'Thạch Lựu','37':'Thạch Lựu','48':'Thạch Lựu','49':'Thạch Lựu','60':'Thạch Lựu','61':'Thạch Lựu','2':'Bình Địa','3':'Bình Địa','14':'Bình Địa','15':'Bình Địa','26':'Bình Địa','27':'Bình Địa','38':'Bình Địa','39':'Bình Địa','50':'Bình Địa','51':'Bình Địa','62':'Bình Địa','63':'Bình Địa','4':'Tang Đố','5':'Tang Đố','16':'Tang Đố','17':'Tang Đố','28':'Tang Đố','29':'Tang Đố','40':'Tang Đố','64':'Tang Đố','41':'Tang Đố','52':'Tang Đố','53':'Tang Đố','6':'Tùng Bách','7':'Tùng Bách','18':'Tùng Bách','19':'Tùng Bách','30':'Tùng Bách','31':'Tùng Bách','42':'Tùng Bách','43':'Tùng Bách','54':'Tùng Bách','55':'Tùng Bách','8':'Đại Lâm','9':'Đại Lâm','20':'Đại Lâm','21':'Đại Lâm','32':'Đại Lâm','33':'Đại Lâm','44':'Đại Lâm','45':'Đại Lâm','56':'Đại Lâm','57':'Đại Lâm','10':'Dương Liễu','11':'Dương Liễu','22':'Dương Liễu','23':'Dương Liễu','34':'Dương Liễu','35':'Dương Liễu','46':'Dương Liễu','47':'Dương Liễu','58':'Dương Liễu','59':'Dương Liễu'}
	fullmenh['Hoả']={'0':'Sơn Hạ','1':'Sơn Hạ','12':'Sơn Hạ','13':'Sơn Hạ','24':'Sơn Hạ','25':'Sơn Hạ','36':'Sơn Hạ','37':'Sơn Hạ','48':'Sơn Hạ','49':'Sơn Hạ','60':'Sơn Hạ','61':'Sơn Hạ','2':'Sơn Đầu','3':'Sơn Đầu','14':'Sơn Đầu','15':'Sơn Đầu','26':'Sơn Đầu','27':'Sơn Đầu','38':'Sơn Đầu','39':'Sơn Đầu','50':'Sơn Đầu','51':'Sơn Đầu','62':'Sơn Đầu','63':'Sơn Đầu','4':'Tích Lịch','5':'Tích Lịch','16':'Tích Lịch','17':'Tích Lịch','28':'Tích Lịch','29':'Tích Lịch','40':'Tích Lịch','64':'Tích Lịch','41':'Tích Lịch','52':'Tích Lịch','53':'Tích Lịch','6':'Lư Trung','7':'Lư Trung','18':'Lư Trung','19':'Lư Trung','30':'Lư Trung','31':'Lư Trung','42':'Lư Trung','43':'Lư Trung','54':'Lư Trung','55':'Lư Trung','8':'Phúc Đăng','9':'Phúc Đăng','20':'Phúc Đăng','21':'Phúc Đăng','32':'Phúc Đăng','33':'Phúc Đăng','44':'Phúc Đăng','45':'Phúc Đăng','56':'Phúc Đăng','57':'Phúc Đăng','10':'Thiên Thượng','11':'Thiên Thượng','22':'Thiên Thượng','23':'Thiên Thượng','34':'Thiên Thượng','35':'Thiên Thượng','46':'Thiên Thượng','47':'Thiên Thượng','58':'Thiên Thượng','59':'Thiên Thượng'}
	fullmenh['Thổ']={'0':'Đại Trạch','1':'Đại Trạch','12':'Đại Trạch','13':'Đại Trạch','24':'Đại Trạch','25':'Đại Trạch','36':'Đại Trạch','37':'Đại Trạch','48':'Đại Trạch','49':'Đại Trạch','60':'Đại Trạch','61':'Đại Trạch','2':'Ốc Thượng','3':'Ốc Thượng','14':'Ốc Thượng','15':'Ốc Thượng','26':'Ốc Thượng','27':'Ốc Thượng','38':'Ốc Thượng','39':'Ốc Thượng','50':'Ốc Thượng','51':'Ốc Thượng','62':'Ốc Thượng','63':'Ốc Thượng','4':'Bích Thượng','5':'Bích Thượng','16':'Bích Thượng','17':'Bích Thượng','28':'Bích Thượng','29':'Bích Thượng','40':'Bích Thượng','64':'Bích Thượng','41':'Bích Thượng','52':'Bích Thượng','53':'Bích Thượng','6':'Thành Đầu','7':'Thành Đầu','18':'Thành Đầu','19':'Thành Đầu','30':'Thành Đầu','31':'Thành Đầu','42':'Thành Đầu','43':'Thành Đầu','54':'Thành Đầu','55':'Thành Đầu','8':'Sa Trung','9':'Sa Trung','20':'Sa Trung','21':'Sa Trung','32':'Sa Trung','33':'Sa Trung','44':'Sa Trung','45':'Sa Trung','56':'Sa Trung','57':'Sa Trung','10':'Lộ Bàn','11':'Lộ Bàn','22':'Lộ Bàn','23':'Lộ Bàn','34':'Lộ Bàn','35':'Lộ Bàn','46':'Lộ Bàn','47':'Lộ Bàn','58':'Lộ Bàn','59':'Lộ Bàn'}
	fullmenh['Kim']={'0':'Kiếm Phong','1':'Kiếm Phong','12':'Kiếm Phong','13':'Kiếm Phong','24':'Kiếm Phong','25':'Kiếm Phong','36':'Kiếm Phong','37':'Kiếm Phong','48':'Kiếm Phong','49':'Kiếm Phong','60':'Kiếm Phong','61':'Kiếm Phong','2':'Thoa Xuyến','3':'Thoa Xuyến','14':'Thoa Xuyến','15':'Thoa Xuyến','26':'Thoa Xuyến','27':'Thoa Xuyến','38':'Thoa Xuyến','39':'Thoa Xuyến','50':'Thoa Xuyến','51':'Thoa Xuyến','62':'Thoa Xuyến','63':'Thoa Xuyến','4':'Hải Trung','64':'Hải Trung','5':'Hải Trung','16':'Hải Trung','17':'Hải Trung','28':'Hải Trung','29':'Hải Trung','40':'Hải Trung','41':'Hải Trung','52':'Hải Trung','53':'Hải Trung','6':'Kim Bạch','7':'Kim Bạch','18':'Kim Bạch','19':'Kim Bạch','30':'Kim Bạch','31':'Kim Bạch','42':'Kim Bạch','43':'Kim Bạch','54':'Kim Bạch','55':'Kim Bạch','8':'Bạch Lạp','9':'Bạch Lạp','20':'Bạch Lạp','21':'Bạch Lạp','32':'Bạch Lạp','33':'Bạch Lạp','44':'Bạch Lạp','45':'Bạch Lạp','56':'Bạch Lạp','57':'Bạch Lạp','10':'Sa Trung','11':'Sa Trung','22':'Sa Trung','23':'Sa Trung','34':'Sa Trung','35':'Sa Trung','46':'Sa Trung','47':'Sa Trung','58':'Sa Trung','59':'Sa Trung'}
	fullmenh['Thủy']={'0':'Tuyền Trung','1':'Tuyền Trung','12':'Tuyền Trung','13':'Tuyền Trung','24':'Tuyền Trung','25':'Tuyền Trung','36':'Tuyền Trung','37':'Tuyền Trung','48':'Tuyền Trung','49':'Tuyền Trung','60':'Tuyền Trung','61':'Tuyền Trung','2':'Đại Hải','3':'Đại Hải','14':'Đại Hải','15':'Đại Hải','26':'Đại Hải','27':'Đại Hải','38':'Đại Hải','39':'Đại Hải','50':'Đại Hải','51':'Đại Hải','62':'Đại Hải','63':'Đại Hải','4':'Giản Hạ','5':'Giản Hạ','16':'Giản Hạ','17':'Giản Hạ','28':'Giản Hạ','29':'Giản Hạ','40':'Giản Hạ','64':'Giản Hạ','41':'Giản Hạ','52':'Giản Hạ','53':'Giản Hạ','6':'Đại Khê','7':'Đại Khê','18':'Đại Khê','19':'Đại Khê','30':'Đại Khê','31':'Đại Khê','42':'Đại Khê','43':'Đại Khê','54':'Đại Khê','55':'Đại Khê','8':'Trường Lưu','9':'Trường Lưu','20':'Trường Lưu','21':'Trường Lưu','32':'Trường Lưu','33':'Trường Lưu','44':'Trường Lưu','45':'Trường Lưu','56':'Trường Lưu','57':'Trường Lưu','10':'Thiên Hà','11':'Thiên Hà','22':'Thiên Hà','23':'Thiên Hà','34':'Thiên Hà','35':'Thiên Hà','46':'Thiên Hà','47':'Thiên Hà','58':'Thiên Hà','59':'Thiên Hà'}

/*
	fullmenh['Mộc']={'0':'Thạch Lựu','1':'Thạch Lựu','12':'Thạch Lựu','13':'Thạch Lựu','24':'Thạch Lựu','25':'Thạch Lựu','36':'Thạch Lựu','37':'Thạch Lựu','48':'Thạch Lựu','49':'Thạch Lựu','60':'Thạch Lựu','61':'Thạch Lựu'}
	fullmenh['Mộc']={'2':'Bình Địa','3':'Bình Địa','14':'Bình Địa','15':'Bình Địa','26':'Bình Địa','27':'Bình Địa','38':'Bình Địa','39':'Bình Địa','50':'Bình Địa','51':'Bình Địa','62':'Bình Địa','63':'Bình Địa'};
	fullmenh['Mộc']={'4':'Tang Đố','5':'Tang Đố','16':'Tang Đố','17':'Tang Đố','28':'Tang Đố','29':'Tang Đố','40':'Tang Đố','41':'Tang Đố','52':'Tang Đố','53':'Tang Đố'};
	fullmenh['Mộc']={'6':'Tùng Bách','7':'Tùng Bách','18':'Tùng Bách','19':'Tùng Bách','30':'Tùng Bách','31':'Tùng Bách','42':'Tùng Bách','43':'Tùng Bách','54':'Tùng Bách','55':'Tùng Bách'};
	fullmenh['Mộc']={'8':'Đại Lâm','9':'Đại Lâm','20':'Đại Lâm','21':'Đại Lâm','32':'Đại Lâm','33':'Đại Lâm','44':'Đại Lâm','45':'Đại Lâm','56':'Đại Lâm','57':'Đại Lâm',};
	fullmenh['Mộc']={'10':'Dương Liễu','11':'Dương Liễu','22':'Dương Liễu','23':'Dương Liễu','34':'Dương Liễu','35':'Dương Liễu','46':'Dương Liễu','47':'Dương Liễu','58':'Dương Liễu','59':'Dương Liễu'}

	fullmenh['Hoả']={'0':'Sơn Hạ','1':'Sơn Hạ','12':'Sơn Hạ','13':'Sơn Hạ','24':'Sơn Hạ','25':'Sơn Hạ','36':'Sơn Hạ','37':'Sơn Hạ','48':'Sơn Hạ','49':'Sơn Hạ','60':'Sơn Hạ','61':'Sơn Hạ'}
	fullmenh['Hoả']={'2':'Sơn Đầu','3':'Sơn Đầu','14':'Sơn Đầu','15':'Sơn Đầu','26':'Sơn Đầu','27':'Sơn Đầu','38':'Sơn Đầu','39':'Sơn Đầu','50':'Sơn Đầu','51':'Sơn Đầu','62':'Sơn Đầu','63':'Sơn Đầu'};
	fullmenh['Hoả']={'4':'Tích Lịch','5':'Tích Lịch','16':'Tích Lịch','17':'Tích Lịch','28':'Tích Lịch','29':'Tích Lịch','40':'Tích Lịch','41':'Tích Lịch','52':'Tích Lịch','53':'Tích Lịch'};
	fullmenh['Hoả']={'6':'Lư Trung','7':'Lư Trung','18':'Lư Trung','19':'Lư Trung','30':'Lư Trung','31':'Lư Trung','42':'Lư Trung','43':'Lư Trung','54':'Lư Trung','55':'Lư Trung'};
	fullmenh['Hoả']={'8':'Phúc Đăng','9':'Phúc Đăng','20':'Phúc Đăng','21':'Phúc Đăng','32':'Phúc Đăng','33':'Phúc Đăng','44':'Phúc Đăng','45':'Phúc Đăng','56':'Phúc Đăng','57':'Phúc Đăng',};
	fullmenh['Hoả']={'10':'Thiên Thượng','11':'Thiên Thượng','22':'Thiên Thượng','23':'Thiên Thượng','34':'Thiên Thượng','35':'Thiên Thượng','46':'Thiên Thượng','47':'Thiên Thượng','58':'Thiên Thượng','59':'Thiên Thượng'}

	fullmenh['Thổ']={'0':'Đại Trạch','1':'Đại Trạch','12':'Đại Trạch','13':'Đại Trạch','24':'Đại Trạch','25':'Đại Trạch','36':'Đại Trạch','37':'Đại Trạch','48':'Đại Trạch','49':'Đại Trạch','60':'Đại Trạch','61':'Đại Trạch'}
	fullmenh['Thổ']={'2':'Ốc Thượng','3':'Ốc Thượng','14':'Ốc Thượng','15':'Ốc Thượng','26':'Ốc Thượng','27':'Ốc Thượng','38':'Ốc Thượng','39':'Ốc Thượng','50':'Ốc Thượng','51':'Ốc Thượng','62':'Ốc Thượng','63':'Ốc Thượng'};
	fullmenh['Thổ']={'4':'Bích Thượng','5':'Bích Thượng','16':'Bích Thượng','17':'Bích Thượng','28':'Bích Thượng','29':'Bích Thượng','40':'Bích Thượng','41':'Bích Thượng','52':'Bích Thượng','53':'Bích Thượng'};
	fullmenh['Thổ']={'6':'Thành Đầu','7':'Thành Đầu','18':'Thành Đầu','19':'Thành Đầu','30':'Thành Đầu','31':'Thành Đầu','42':'Thành Đầu','43':'Thành Đầu','54':'Thành Đầu','55':'Thành Đầu'};
	fullmenh['Thổ']={'8':'Sa Trung','9':'Sa Trung','20':'Sa Trung','21':'Sa Trung','32':'Sa Trung','33':'Sa Trung','44':'Sa Trung','45':'Sa Trung','56':'Sa Trung','57':'Sa Trung',};
	fullmenh['Thổ']={'10':'Lộ Bàn','11':'Lộ Bàn','22':'Lộ Bàn','23':'Lộ Bàn','34':'Lộ Bàn','35':'Lộ Bàn','46':'Lộ Bàn','47':'Lộ Bàn','58':'Lộ Bàn','59':'Lộ Bàn'}

	fullmenh['Kim']={'0':'Kiếm Phong','1':'Kiếm Phong','12':'Kiếm Phong','13':'Kiếm Phong','24':'Kiếm Phong','25':'Kiếm Phong','36':'Kiếm Phong','37':'Kiếm Phong','48':'Kiếm Phong','49':'Kiếm Phong','60':'Kiếm Phong','61':'Kiếm Phong'}
	fullmenh['Kim']={'2':'Thoa Xuyến','3':'Thoa Xuyến','14':'Thoa Xuyến','15':'Thoa Xuyến','26':'Thoa Xuyến','27':'Thoa Xuyến','38':'Thoa Xuyến','39':'Thoa Xuyến','50':'Thoa Xuyến','51':'Thoa Xuyến','62':'Thoa Xuyến','63':'Thoa Xuyến'};
	fullmenh['Kim']={'4':'Hải Trung','5':'Hải Trung','16':'Hải Trung','17':'Hải Trung','28':'Hải Trung','29':'Hải Trung','40':'Hải Trung','41':'Hải Trung','52':'Hải Trung','53':'Hải Trung'};
	fullmenh['Kim']={'6':'Kim Bạch','7':'Kim Bạch','18':'Kim Bạch','19':'Kim Bạch','30':'Kim Bạch','31':'Kim Bạch','42':'Kim Bạch','43':'Kim Bạch','54':'Kim Bạch','55':'Kim Bạch'};
	fullmenh['Kim']={'8':'Bạch Lạp','9':'Bạch Lạp','20':'Bạch Lạp','21':'Bạch Lạp','32':'Bạch Lạp','33':'Bạch Lạp','44':'Bạch Lạp','45':'Bạch Lạp','56':'Bạch Lạp','57':'Bạch Lạp',};
	fullmenh['Kim']={'10':'Sa Trung','11':'Sa Trung','22':'Sa Trung','23':'Sa Trung','34':'Sa Trung','35':'Sa Trung','46':'Sa Trung','47':'Sa Trung','58':'Sa Trung','59':'Sa Trung'}

	fullmenh['Thủy']={'0':'Tuyền Trung','1':'Tuyền Trung','12':'Tuyền Trung','13':'Tuyền Trung','24':'Tuyền Trung','25':'Tuyền Trung','36':'Tuyền Trung','37':'Tuyền Trung','48':'Tuyền Trung','49':'Tuyền Trung','60':'Tuyền Trung','61':'Tuyền Trung'}
	fullmenh['Thủy']={'2':'Đại Hải','3':'Đại Hải','14':'Đại Hải','15':'Đại Hải','26':'Đại Hải','27':'Đại Hải','38':'Đại Hải','39':'Đại Hải','50':'Đại Hải','51':'Đại Hải','62':'Đại Hải','63':'Đại Hải'};
	fullmenh['Thủy']={'4':'Giản Hạ','5':'Giản Hạ','16':'Giản Hạ','17':'Giản Hạ','28':'Giản Hạ','29':'Giản Hạ','40':'Giản Hạ','41':'Giản Hạ','52':'Giản Hạ','53':'Giản Hạ'};
	fullmenh['Thủy']={'6':'Đại Khê','7':'Đại Khê','18':'Đại Khê','19':'Đại Khê','30':'Đại Khê','31':'Đại Khê','42':'Đại Khê','43':'Đại Khê','54':'Đại Khê','55':'Đại Khê'};
	fullmenh['Thủy']={'8':'Trường Lưu','9':'Trường Lưu','20':'Trường Lưu','21':'Trường Lưu','32':'Trường Lưu','33':'Trường Lưu','44':'Trường Lưu','45':'Trường Lưu','56':'Trường Lưu','57':'Trường Lưu',};
	fullmenh['Thủy']={'10':'Thiên Hà','11':'Thiên Hà','22':'Thiên Hà','23':'Thiên Hà','34':'Thiên Hà','35':'Thiên Hà','46':'Thiên Hà','47':'Thiên Hà','58':'Thiên Hà','59':'Thiên Hà'}

	fullmenh[1]=["Tích Lịch"];
	fullmenh[1]=["Tùng Bách"];
	fullmenh[1]=["Trường Lưu"];
	fullmenh[1]=["Sơn Hạ"];
	fullmenh[1]=["Bình Địa"];
	fullmenh[1]=["Bích Thượng"];
	fullmenh[1]=["Kim Bạch"];
	fullmenh[1]=["Phúc Đăng"];
	fullmenh[1]=["Thiên Hà"];
	fullmenh[1]=["Đại Dịch"];
	fullmenh[1]=["Thoa Xuyến"];
	fullmenh[1]=["Tang Đố"];
	fullmenh[1]=["Sa Trung"];
	fullmenh[1]=["Lộ Trung"];
	fullmenh[1]=["Giản Hạ"];
	fullmenh[1]=["Thành Đầu"];
	fullmenh[1]=["Bạch Lạp"];
	fullmenh[1]=["Dương Liễu"];
	fullmenh[1]=["Tuyền Trung"];
	fullmenh[1]=["Ốc Thượng"];
*/



var xv_can = new Array("Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý");
var xvii_chi = new Array("T\375", "S\u1EEDu", "D\u1EA7n", "M\343o", "Th\354n", "T\u1EF5", "Ng\u1ECD", "M\371i", "Th\342n", "D\u1EADu", "Tu\u1EA5t", "H\u1EE3i");
var rthap_thien_can={};rthap_thien_can["Canh"]=0;rthap_thien_can["Tân"]=1;rthap_thien_can["Nhâm"]=2;rthap_thien_can["Quý"]=3;rthap_thien_can["Giáp"]=4;rthap_thien_can["Ất"]=5;rthap_thien_can["Bính"]=6;rthap_thien_can["Đinh"]=7;rthap_thien_can["Mậu"]=8;rthap_thien_can["Kỷ"]=9;
var	rthap_nhi_chi={};rthap_nhi_chi["0"]=["Tý"];rthap_nhi_chi["1"]=["Sửu"];rthap_nhi_chi["2"]=["Dần"];rthap_nhi_chi["3"]=["Mẹo"];rthap_nhi_chi["4"]=["Thìn"];rthap_nhi_chi["5"]=["Tỵ"];rthap_nhi_chi["6"]=["Ngọ"];rthap_nhi_chi["7"]=["Mùi"];rthap_nhi_chi["8"]=["Thân"];rthap_nhi_chi["9"]=["Dậu"];rthap_nhi_chi["10"]=["Tuất"];rthap_nhi_chi["11"]=["Hợi"];
var	xthap_nhi_chi={};xthap_nhi_chi["Tý"]=0;xthap_nhi_chi["Sửu"]=1;xthap_nhi_chi["Dần"]=2;xthap_nhi_chi["Mẹo"]=3;xthap_nhi_chi["Thìn"]=4;xthap_nhi_chi["Tỵ"]=5;xthap_nhi_chi["Ngọ"]=6;xthap_nhi_chi["Mùi"]=7;xthap_nhi_chi["Thân"]=8;xthap_nhi_chi["Dậu"]=9;xthap_nhi_chi["Tuất"]=10;xthap_nhi_chi["Hợi"]=11;
	var hor,legalhor;
	if (parseInt(year)>1984){place_y= parseInt(year)-1984;if (place_y>60){var idoue= Math.ceil(place_y/60); hor= parseInt(year)-(idoue*60)-20-1900;legalhor=hor;} else{hor =parseInt(year)-60-20-1900;  legalhor=hor;} }
	else if (parseInt(year)<1921){place_y= 1921-parseInt(year);if (place_y>60){var idoue= Math.ceil(place_y/60); hor= parseInt(year)+(idoue*60)-20-1900;legalhor=hor;} else{hor =parseInt(year)+60-20-1900; legalhor=hor;} }
	else{ hor= parseInt(year)-20-1900; legalhor=hor;}
	var thiencan= thap_thien_can[year.substr(year.length - 1)];
	var yearten= thap_nhi_can[hor];
	
var frist_month;
if (thiencan=="Giáp" || thiencan=="Kỷ") {frist_month="Bính";}
if (thiencan=="Ất" || thiencan=="Canh") {frist_month="Mậu";}
if (thiencan=="Bính" || thiencan=="Tân") {frist_month="Canh";}
if (thiencan=="Đinh" || thiencan=="Nhâm") {frist_month="Nhâm";}
if (thiencan=="Mậu" || thiencan=="Quý") {frist_month="Giáp";}
var selectmonth = rthap_thien_can[frist_month]+month;
var selectmonth_chi = month;

	if(selectmonth>10){selectmonth=selectmonth-10-1;} else {selectmonth=selectmonth-1;}
	if(selectmonth_chi>11){selectmonth_chi=selectmonth_chi-12;} else {selectmonth_chi=selectmonth_chi+1;if(selectmonth_chi>11){selectmonth_chi=selectmonth_chi-12;}}
	
	if(month==1){ var thang=''+frist_month+' Dần';} else {
			
			var thang=''+thap_thien_can[selectmonth]+' '+rthap_nhi_chi[(month+1)%12];
	}
	var month_name;
	if(month==1){month_name='giêng';}else if(month==2){month_name='hai';}else if(month==3){month_name='ba';}else if(month==4){month_name='tư';}else if(month==5){month_name='năm';}else if(month==6){month_name='sáu';}else if(month==7){month_name='bảy';}else if(month==8){month_name='tám';}else if(month==9){month_name='chín';}else if(month==10){month_name='mười';}else if(month==11){month_name='mười một';}else{month_name='chạp';}
	var nhamngay;
	var nhamngay='<br>Dương lịch tương ứng là ngày '+nday+', tháng '+nmonth+', năm '+nyear+';';

	var jd=jdFromDate(parseInt(nday),parseInt(nmonth),parseInt(nyear));
	var	dayName = xv_can[(jd + 9) % 10] + " " + xvii_chi[(jd+1)%12];
	var	hour_ty = xv_can[(jd-1)*2 % 10];
	/*	
	var hientai=rthap_thien_can[hour_ty]+hours;
		if(hientai>40){var hour_ty_now=hientai-40-1;} 
			else if(hientai>30){var hour_ty_now=hientai-30-1; } 
			else if(hientai>20){var hour_ty_now=hientai-20-1;} 
			else if(hientai>11){var hour_ty_now=hientai-10-1;} 
			else if(hientai=11){var hour_ty_now=hientai-10;} 
			else{var hour_ty_now=hientai;}
	//	if(hour_ty_now<0){hour_ty_now=0;}
		if((hour_ty_now % 2)==0 && hour_ty_now>1){
			hour_ty_now=hour_ty_now-1;
		} 
		else if((hour_ty_now % 2)!=0 && hour_ty_now>1 ){
			hour_ty_now=hour_ty_now-1;
		}
	//	if(hour_ty_now<0){hour_ty_now=0;}
		var giohientai = rthap_thien_can[hour_ty_now];
*/


			var can_gio_hientai= hour_ty+ ' Tý';

	var curent_hour = hour_name;
	var retcurn='';
	var nguhanhc={};
		nguhanhc['Mộc']=1;
		nguhanhc['Hoả']=2;
		nguhanhc['Thổ']=3;
		nguhanhc['Kim']=4;
		nguhanhc['Thủy']=5;
		
	var nguhanha={};
		nguhanha['1']="Mộc";
		nguhanha['2']="Hoả";
		nguhanha['3']="Thổ";
		nguhanha['4']="Kim";
		nguhanha['5']="Thủy";
	var thienc=can_chi_chi[yearten];
	var chic=can_chi_can[thiencan];
	var gtmenhtuoi = parseInt(can_cdh[thiencan]) + parseInt(chi_cdh[yearten]);
	//	console.log(gtmenhtuoi);
	var menhtuox=hanh_cdh[(gtmenhtuoi-1)%  5 ?(gtmenhtuoi-1)%  5:0] ;
	var menhtuoi = eval("fullmenh."+menhtuox+"["+legalhor+"]");
	//	console.log(fullmenh.Kim);
		var fontcolorwe,endcolored;
		if(menhtuox=="Mộc"){fontcolorwe = '#58D68D';}
		if(menhtuox=="Hoả"){fontcolorwe = '#EC7063';}
		if(menhtuox=="Thổ"){fontcolorwe = '#F7DC6F';}
		if(menhtuox=="Kim"){fontcolorwe = '#B2BABB';}
		if(menhtuox=="Thủy"){fontcolorwe = '#AED6F1';}
		
		
		var tuongsinh,tuongkhac;
		if(menhtuox=='Mộc'){tuongsinh='Hoả';tuongkhac='Thổ';}
		if(menhtuox=='Hoả'){tuongsinh='Thổ';tuongkhac='Kim';}
		if(menhtuox=='Thổ'){tuongsinh='Kim';tuongkhac='Thủy';}
		if(menhtuox=='Kim'){tuongsinh='Thủy';tuongkhac='Mộc';}
		if(menhtuox=='Thủy'){tuongsinh='Mộc';tuongkhac='Hoả';}
		//	console.log(eval("fullmenh."+tuongkhac));
		var hopmenh = eval("fullmenh."+tuongsinh+"["+legalhor+"]");
		var khacmenh = eval("fullmenh."+tuongkhac+"["+legalhor+"]");
	//	console.log(legalhor);


		menhtuoi= '<span style="color:'+fontcolorwe+'">'+menhtuoi+' '+menhtuox+'</span>';


	var nguhanhsinh;
	var nguhanhkhac;
//	console.log('Giá trị mạng tuổi ('+menhtuoi+'):');
//	console.log('Giá trị địa chi ('+chi_cdh[yearten]+'):');
//	console.log('Thiên can ('+thiencan+'):'+thienc);
	var cketcanchi;
	if(nguhanhc[thienc] == 1){nguhanhsinh=2;nguhanhkhac=3;	}
	if(nguhanhc[thienc] == 2){nguhanhsinh=3;nguhanhkhac=4;	}
	if(nguhanhc[thienc] == 3){nguhanhsinh=4;nguhanhkhac=5;	}
	if(nguhanhc[thienc] == 4){nguhanhsinh=5;nguhanhkhac=1;	}
	if(nguhanhc[thienc] == 5){nguhanhsinh=1;nguhanhkhac=2;	}
		
	if(nguhanhc[chic] == 1){nguhanhsinhv=2;nguhanhkhacv=3;	}
	if(nguhanhc[chic] == 2){nguhanhsinhv=3;nguhanhkhacv=4;	}
	if(nguhanhc[chic] == 3){nguhanhsinhv=4;nguhanhkhacv=5;	}
	if(nguhanhc[chic] == 4){nguhanhsinhv=5;nguhanhkhacv=1;	}
	if(nguhanhc[chic] == 5){nguhanhsinhv=1;nguhanhkhacv=2;	}


	if(nguhanha[nguhanhsinhv]==nguhanha[nguhanhc[thienc]]){cketcanchi='thiên can sinh địa chi, 100% - cuộc đời của bạn sẽ không trải qua biến cố nào to lớn, nếu bạn không bị gia đình hoặc nơi ở tác động đến kiếp số của bạn.';}
	if(nguhanha[nguhanhkhacv]==nguhanha[nguhanhc[thienc]]){cketcanchi='thiên can khắc địa chi, 40% - bạn có một cuộc sống nằm ở trên mức bất hạnh (nghĩa là không bất hạnh), nhưng lại dưới mức bình thường (nghĩa là không được trọn vẹn đủ đầy), nếu nó cao hơn nghĩa là bạn đang vay, còn bạn có ít hơn nghĩa là bạn đang trả.';}
//	console.log('nguhanha[nguhanhsinh]: '+nguhanha[nguhanhsinh]);
//	console.log('nguhanha[nguhanhc[thienc]]: '+nguhanha[nguhanhc[thienc]]);

	if(nguhanha[nguhanhsinh]==nguhanha[nguhanhc[chic]]){cketcanchi='địa chi sinh thiên can, 60% - những người xung quanh bạn sẽ luôn giúp đỡ cho bạn, bạn thành công là do họ, và thất bại cũng từ họ.';}
	if(nguhanha[nguhanhkhac]==nguhanha[nguhanhc[chic]]){cketcanchi='địa chi khắc thiên can, 20% - nếu bạn cảm thấy cuộc đời bạn may mắn và đủ đầy, thì đó là do phúc trạch, và công quả mà gia đình tổ tiên để lại cho bạn.';}

	if(chic==thienc){cketcanchi='can chi bình hoà, 80% - bạn sinh ra vốn đã không phải gánh chịu thiên kiếp nào, tuy nhiên những gì bạn đã gieo nhân từ thời điểm đó, toàn bộ chúng sẽ sớm đươm hoa , kết quả.';}
	
	if(can_gio_hientai.split(' ')[0] == 'Giáp'){var counttime= t1[hours]+' '+hours_chi[hours];}
	if(can_gio_hientai.split(' ')[0] == 'Bính'){var counttime= t2[hours]+' '+hours_chi[hours];}
	if(can_gio_hientai.split(' ')[0] == 'Mậu'){var counttime= t3[hours]+' '+hours_chi[hours];}
	if(can_gio_hientai.split(' ')[0] == 'Canh'){var counttime= t4[hours]+' '+hours_chi[hours];}
	if(can_gio_hientai.split(' ')[0] == 'Nhâm'){var counttime= t5[hours]+' '+hours_chi[hours];}
	
	
	
	var icceeer=' ('+year+' âm lịch)';
	if (year ==nyear){
	icceeer='cùng với năm dương lịch';
	}
	
	
	var cung = cungphi(year);
	
	if(dlal.substr(-2)=="ng"){
	retcurn ='Bạn xem ngày '+nday+' tháng '+nmonth+', năm '+nyear+' dương lịch</br>Cung phi <span style="color:'+fontcolorwe+'">'+(cung['cung'])+' '+menhtuox+'</span> '+(cung['huong'])+', ngũ hành '+menhtuoi+', bát tự của bạn sẽ rơi vào giờ '+counttime.toLowerCase()+', ngày '+dayName.toLowerCase()+' (tức ngày '+day+'), tháng '+(thang.toLowerCase())+' (tức tháng '+month_name.toLowerCase()+') , năm '+(thiencan.toLowerCase())+' '+yearten+' '+icceeer+'.<br>Thuộc '+iscanduongornam+' nạp âm của bạn là can <b>'+chic+'</b>, chi <b>'+thienc+'</b>, là '+cketcanchi+', tháng sinh của bạn là tháng đại diện cho tính chất '+ynghiathang[month]+', '+ynghiathangex[month]+'';
	}else{
	retcurn ='Bạn xem ngày '+day+', tháng '+month_name+', năm '+year+' âm lịch, có cung phi <span style="color:'+fontcolorwe+'">'+(cung['cung'])+' '+menhtuox+'</span> '+(cung['huong'])+', ngũ hành '+menhtuoi+', bát tự của bạn là giờ '+(counttime.toLowerCase())+', ngày '+(dayName.toLowerCase())+', tháng '+(thang.toLowerCase())+' - năm '+(thiencan.toLowerCase())+' '+(yearten.toLowerCase())+'. '+nhamngay+'<br>Thuộc '+iscanduongornam+' chi: <b>'+thienc+'</b> nạp âm của bạn là can: <b>'+chic+'</b>, là '+cketcanchi+', tháng sinh của bạn là tháng đại diện cho tính chất '+ynghiathang[month]+', '+ynghiathangex[month]+'';
	}

	var tifj = kethopcung(cung['cung']);
	var fokv = tamhapnhihaptuxung(yearten);
	//	console.log(hopmenh);
		if(fokv['tt'] !=='không có'){var tthv='<span class="splist plf-5 b ralert">Tuyệt mạng: <span class="walert">'+fokv['tt']+'</span></span>'; var tvtd=' - tứ tuyệt';} else{var tthv='';var tvtd='';}
		
	retcurn+='<h4>Ngũ hành sinh khắc</h4>'+
	'<p class="plf-1">Ngũ hành của bạn <u>tương sinh</u> với mạng <span class="navy">'+tuongsinh+'</span> và tương <u>khắc</u> với mạng <span class="danger">'+tuongkhac+'</span> nói chung.</p>'+
	'<span class="plf splist"><b class="plr-1">Tương sinh mạnh nhất với </b><b class="navy"> '+ hopmenh+' '+tuongsinh+'</b></span>'+
	'<span class="plf splist"><b class="plr-1">và tương khắc nhiều nhất với</b><b class="danger"> '+ khacmenh+' '+tuongkhac+'</b></span>'+
	'<h4>Bát trạch cung phi</h4>'+
	'<p class="plf-1">“Bát trạch cung phi để xem toạ độ, không gian, phương hướng, và cung mệnh... khi cung của bạn kết hợp với các cung khác”</p>'+
	'<table><thead><tr><th><span class="plf-1 b splist ">'+tifj['siki']+' (<span class="success">sinh khí</span>)</span></th>'+
	'<th><span class="mag-4 plf-1 b splist">'+tifj['tume']+' (<span class="ralert">tuyệt mệnh</span>)</span></th></tr></thead><tbody><tr>'+
	'<td><span class="plf-1 b splist">'+tifj['phdu']+' (<span class="info">phước đức</span>)</span></td>'+
	'<td><span class="mag-4 plf-1 b splist">'+tifj['ngqu']+' (<span class="walert">ngũ quỷ</span>)</span></span></td></tr><tr>'+
	'<td><span class="plf-1 b splist">'+tifj['thny']+' (<span class="info">thiên y</span>)</span></td>'+
	'<td><span class="mag-4 plf-1 b splist">'+tifj['luxa']+' (<span class="walert">lục sát</span>)</span></span></td></tr><tr>'+
	'<td><span class="plf-1 b splist">'+tifj['phvi']+' (<span class="info">phục vị</span>)</span></td>'+
	'<td><span class="mag-4 plf-1 b splist">'+tifj['hoha']+' (<span class="walert">hoạ hại</span>)</span></span></td></tr></tbody></table>'+
//	'<span class=" plf b splist">'+tifj['siki']+' (<span class="success">sinh khí</span>)<span class="plf b">'+tifj['tume']+' (<span class="ralert">tuyệt mệnh</span>)</span></span>'+
//	'<span class="plf-5 b splist">'+tifj['phdu']+' (<span class="info">phước đức</span>)<span class="plf-5 b">'+tifj['ngqu']+' (<span class="walert">ngũ quỷ</span>)</span></span>'+
//	'<span class="plf-5 b splist">'+tifj['thny']+' (<span class="info">thiên y</span>)	<span class="plf-5 b">'+tifj['luxa']+' (<span class="walert">lục sát</span>)</span></span>'+
//	'<span class="plf-5 b splist">'+tifj['phvi']+' (<span class="info">phục vị</span>)	<span class="plf-5 b">'+tifj['hoha']+' (<span class="walert">hoạ hại</span>)</span></span>'+
	'<h4>Địa chi tam hợp - tứ xung'+tvtd+'</h4>'+
	'<p class="plf-1">“Địa chi xung - hợp tuổi phải bao gồm tuổi của bạn, kết hợp bát trạch cung phi và ngũ hành sinh khắc.”</p>'+
	'<span class="plf-5 splist"><span class="blue b">Nhị hợp  '+(yearten)+' : </span> '+fokv['nh']+'</span>'+
	'<span class="plf-5 splist"><span class="success b">Tam hợp  '+(yearten)+' : </span> '+fokv['th']+'</span>'+
	'<span class="plf-5 splist"><span class="walert b">Tứ xung '+(yearten)+' : </span> '+fokv['tx']+'</span>'+tthv+
	'';
	
		
	
	var creturn ={};
	creturn['text']=retcurn;
	creturn['ngayduong']=nday;
	creturn['thangduong']=nmonth;
	creturn['namduong']=nyear;
	creturn['ngayam']=day;
	creturn['thangam']=month;
	creturn['namam']=year;
	creturn['tenngay']='';
	creturn['tenthang']=thang;
	creturn['tennam']=thiencan+' '+yearten;
	creturn= JSON.stringify(creturn);
	var tcc,dcc;
	if(thiencan==='Giáp'){tcc=1;}
	if(thiencan==='Ất'){tcc=2;}
	if(thiencan==='Bính'){tcc=3;}
	if(thiencan==='Đinh'){tcc=4;}
	if(thiencan==='Mậu'){tcc=5;}
	if(thiencan==='Kỷ'){tcc=6;}
	if(thiencan==='Canh'){tcc=7;}
	if(thiencan==='Tân'){tcc=8;}
	if(thiencan==='Nhâm'){tcc=9;}
	if(thiencan==='Quý'){tcc=10;}
		
	if(yearten==='Tý'){dcc=1;}
	if(yearten==='Sửu'){dcc=2;}
	if(yearten==='Dần'){dcc=3;}
	if(yearten==='Mẹo'){dcc=4;}
	if(yearten==='Thìn'){dcc=5;}
	if(yearten==='Tỵ'){dcc=6;}
	if(yearten==='Ngọ'){dcc=7;}
	if(yearten==='Mùi'){dcc=8;}
	if(yearten==='Thân'){dcc=9;}
	if(yearten==='Dậu'){dcc=10;}
	if(yearten==='Tuất'){dcc=11;}
	if(yearten==='Hợi'){dcc=12;}

	var gcff=hours_chi[hours];

	if(gcff==='Tý'){dcx=1;}
	if(gcff==='Sửu'){dcx=2;}
	if(gcff==='Dần'){dcx=3;}
	if(gcff==='Mẹo'){dcx=4;}
	if(gcff==='Thìn'){dcx=5;}
	if(gcff==='Tỵ'){dcx=6;}
	if(gcff==='Ngọ'){dcx=7;}
	if(gcff==='Mùi'){dcx=8;}
	if(gcff==='Thân'){dcx=9;}
	if(gcff==='Dậu'){dcx=10;}
	if(gcff==='Tuất'){dcx=11;}
	if(gcff==='Hợi'){dcx=12;}


var finyear =parseInt(year);
if(year>2000){finyear=finyear-60;}
else if (year<1941){finyear=finyear+60;}
	
	
if(finyear>2000 || finyear<1940){document.querySelector('#tv').innerHTML='Tử vi chưa được bổ sung, hiện chỉ có thể xem bát tự.';}
else{	
document.querySelector('#tv').innerHTML='Kết quả tử vi của bạn đang được thu thập và xây dựng, có thể mất một lúc...';
var uril=location.href.split('#')[0]+'&vansu='+yearten+'&vsu='+thiencan;	
	uril=uril.replace('index.html','kci.php'); { uril= uril.replace('/lich/','/lich/kci.php');}
	if(!uril.match(/(kci\.php)/i)){}
	uril=uril.replace(nyear,finyear);
if(ftewdcv==false){
ftewdcv=true;
//_________________________________________________________________________________________

function paswrreponse(response){


  	  if (response ==''){document.querySelector('#tv').innerHTML='Không thể tải dữ liệu tử vi tại thời điểm này, hãy kiểm tra kết nối internet của bạn hoặc thử lại vào lúc khác';}
        response= response.replace(/(\(bạn\sđang\sxem.+\))/ig,"");
		response=response.replace(/(href\=\"http\:\/\/cohoc\.net\/([a-z\-\_]+))/,'ihref="kinh/que/');
      document.querySelector('#tv').innerHTML=response;
      
      $(".thamkhao").hide();
      if($('a[name="phumuc_end"]')){$("ol").append('<li><a href="#phumuc_end">PHỤ LỤC: TỔNG KẾT VỀ TÍNH CÁCH</a></li>');}
      $("ol").append('<li><a href="#loiban_end">PHỤ LỤC: LỜI BÌNH VỀ TUỔI CỦA BẠN</a></li>');
  
	 
		
var el = document.createElement("div");el.className="ynghiacung";
var phuthe =document.querySelector('.giaidoan-cung a[name="phu-the"]')
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung phu thê</h3><div class="ketqua ynghia"><ul><li>Cung này chỉ về người hôn phối nên dựa vào đó người ta có thể phần nào biết về tính cách, dung mạo, tài năng của người hôn phối trong lá số của mỗi cá nhân.</li>'+
'<li>Cung này báo hiệu một phần khả năng tài chính cũng như sự nghiệp của đối tượng kết hôn. Nhiều người xuất sắc trong lĩnh vực này có thể đoán được phần nào sự nghiệp, tình hình tài chính của nửa kia đương số thông qua cung này.</li>'+
'<li>Cung này chỉ về quan hệ hôn nhân. Tình cảm vợ chồng họ gắn bó, thủy chung hay gập ghềnh, sóng gió, có hòa thuận hạnh phúc hay mâu thuẫn, cãi vã, khắc khẩu. Có tình trạng ly hôn, nhiều vợ, nhiều chồng hay kết hôn nhiều lần hay không?</li>'+
'<li>Đối tượng hôn phối người đó gặp được là ở gần địa phương hay ở địa phương khác. Quan hệ vợ chồng có phải xa nhau vì hoàn cảnh công việc hay không.</li>'+
'<li>Đối tượng hôn phối có giúp đỡ đắc lực trong sự nghiệp của đương số hay không?</li>'+
'<li>Những người xuất sắc có thể dựa vào hệ thống cung này để đoán về mối quan hệ với gia đình nhà chồng hoặc nhà vợ của đương số.</li>'+
'<li>Dùng cung này có thể đoán được tình trạng kết hôn sớm hay kết hôn muộn, có lập gia đình hay là người độc thân. Khi nào thì có hạn hôn nhân</li></ul></div>';
insertAfter(phuthe , el);
//_________________________________________________________________________________________


var cungmenh =document.querySelector('.giaidoan-cung a[name="menh"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung mệnh</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung mệnh hay còn được gọi là Bổn Mệnh hoặc Bản Mệnh là cung chính để xem tử vi, tướng pháp và vệnh mệnh của mỗi người.</li>'+
'<li>Là bát trạch chính thức rất quan trọng trong thuật Phong Thủy nhằm để xác định các yếu tố Ngũ Hành nạp âm, định hướng phong thủy, khái quát tương lai, hôn nhân, kết hợp làm ăn, khai thông vận mệnh. Mang lại may mắn, sức khỏe, hạnh phúc, thịnh vượng, hỗ trợ việc hoán cải số phận.</li>'+
'<li>Cung Mệnh có ảnh hưởng mạnh và mang tính chủ đạo từ khi mới sinh đến ngoài 30 tuổi, thời gian này cung Thân cũng đã ảnh hưởng rồi nhưng thụ động. Sau 30 tuổi người ta bước vào giai đoạn thành thục,các sao tọa thủ cung Mệnh ảnh hưởng yếu đi trở thành thụ động, các sao tọa thủ cung Thân ảnh hưởng mạnh lên mang tính chủ đạo, chi phối mọi hành vi và phát triển của con người từ lúc đó đến lúc chết.</li>'+
'<li>Theo ý kiến các chuyên gia phong thủy: Từ lúc lọt lòng mẹ cho đến năm 30 tuổi, phải căn cứ vào cung Mệnh để xem xét một sự tốt xấu và luận đoán vận hạn, còn từ 30 tuổi trở đi, phải căn cứ vào cung Thân, nhưng dù sao cũng vẫn phải chú ý đến cung Mệnh.</li></ul></div>';
insertAfter(cungmenh , el);
//_________________________________________________________________________________________
var cungthan =document.querySelector('.giaidoan-cung a[name="than"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung thân</h3><div class="ketqua ynghia"><ul>'+
'<li>Thân chỉ hành động của bản thân, là hoạt động ta tham dự vào, là con người hành động gắn với đó, là lĩnh vực nổi bật của cuộc sống, là cái ta coi trọng, dính mắc vào, chi phối qua lại.</li>'+
'<li>Cung này không có 1 vị trí độc lập nào mà đóng tại 1 trong các cung như Phối, Di, Quan, Phúc, Tài, Mệnh. Đây là cường cung tức là các lĩnh vực có tầm quan trọng của con người và cũng có lúc về cha mẹ, cuộc sống và sự sống còn.</li>'+
'<li>Điều trước tiên khi đoán mệnh, đó chính là phải cách xem cung thân tọa thủ tại cung nào? Có những ngôi sao nào? Là miếu hay hãm địa? Và phải nghiên cứu cho kỹ càng không được sơ sài.</li></ul></div>';
insertAfter(cungthan , el);
//_________________________________________________________________________________________
var tu_tuc =document.querySelector('.giaidoan-cung a[name="tu-tuc"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung tử tức</h3><div class="ketqua ynghia"><ul>'+
'<li>Đây là cung chủ quản vấn đề sinh nở, con cái.. Bao gồm toàn bộ các vấn đề về con cái như sinh được mấy con, đông con hay hiếm muộn, con cái với đương số thân hay sơ, con cái bình thường hay phát đạt, hiền lành hay ngỗ nghịch,ngoài ra còn chỉ về mối nhân duyên quan hệ của đương số với con cái được gắn bó hay mờ nhạt, có khắc nhau không,..</li>'+
'<li>Cung Tử Tức cũng giúp luận đoán về tình trạng sức khỏe sinh sản giới tính của mỗi cá nhân. Cung này còn gọi là cung đào hoa theo nhiều người.</li>'+
'</ul></div>';
insertAfter(tu_tuc , el);
//_________________________________________________________________________________________
var tai_bach =document.querySelector('.giaidoan-cung a[name="tai-bach"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung tài bạch</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung Tài Bạch là cung vị làm chủ tài khí suốt một đời của đương số.</li>'+
'<li>Thông qua Cung Tài Bạch, chúng ta có thể tìm hiểu khuynh hướng chủ yếu của hình thức có tiền bạc, như thu nhập cố định (chính tài), thu nhập bất ngờ (Thiên tài), tiền của do kinh doanh làm ăn mà có. Đồng thời có thể luận đoán vận thế tài lộc của đương số thông qua một số cách cục đặc biệt khác.</li>'+
'</ul></div>';
insertAfter(tai_bach , el);
//_________________________________________________________________________________________
var phuc_duc =document.querySelector('.giaidoan-cung a[name="phuc-duc"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung phước đức</h3><div class="ketqua ynghia"><ul>'+
'<li>Được biết đến là cung chỉ về họ hàng, tổ tiên...</li>'+
'<li>Cung phước đức còn mang ý nghĩa là kiến trúc thượng tầng trong cấu trúc tâm lý của khổ chủ,chỉ về nhân duyên với họ hàng, gia đình cũng như chỉ số hạnh phúc của mỗi người, về những may mắn hay quá trình chuyển hóa nguy nan thành bình an cho khổ chủ</li>'+
'<li>Ngoài ra, cung phước đức còn mang ý nghĩa khi tam chiếu cung Phu Thê.</li>'+
'</ul></div>';
insertAfter(phuc_duc , el);
//_________________________________________________________________________________________
var dien_trach =document.querySelector('.giaidoan-cung a[name="dien-trach"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung điền trạch</h3><div class="ketqua ynghia"><ul>'+
'<li>Điền Trạch không phải là một cung nói về con người, như Phụ mẫu, Huynh đệ, Phu thê hay Tử tức. Cung Điền Trạch chủ địa lý nơi ở, mô phỏng nhà cửa, ruộng vườn, đất đai, mua bán bất động sản, nơi sinh sống của đương số.</li>'+
'<li>Về phương diện của cải thì Điền cung được coi trọng hơn là cung Tài bạch. Vì Tài bạch chỉ đơn thuần là cách thức kiếm tiền, khả năng kiếm được nhiều hay ít và nói lên phương diện nghề nghiệp. Còn Điền cung là khả năng người ta thực tế sở hữu, cái người ta giữ lại được. Bởi có những người tiền tuy kiếm như nước nhưng cũng dễ bị hao tán bởi người thân con cháu phá tán hoặc ốm đau, tiêu xài hoang phí.</li>'+
'<li>Ngược lại có những người kiếm tiền không quá giỏi nhưng lại vẫn giàu có. Vì được thừa kế tài sản từ thế hệ trước hoặc lấy được vợ chồng giàu hoặc được nhờ cậy người thân</li>'+
'</ul></div>';
insertAfter(dien_trach , el);
//_________________________________________________________________________________________
var tat_ach =document.querySelector('.giaidoan-cung a[name="tat-ach"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung tật ách</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung Tật Ách nói nên tình trạng sức khỏe của đương số, cũng như các xu hướng bệnh tật mà đương số có thể mắc phải. Tùy theo kết cấu tổ hợp của các tinh hệ mà có thể rơi vào các nhóm như: hô hấp, tuần hoàn, tiêu hóa, thần kinh, ..</li>'+
'</ul></div>';
insertAfter(tat_ach , el);
//_________________________________________________________________________________________
var thien_di =document.querySelector('.giaidoan-cung a[name="thien-di"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung thiên di</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung Thiên Di dùng để luận đoán về vấn đề từ nơi sinh ra, dời đến nơi khác để ở. Đồng thời cũng có thể dùng để luận đoán tình trạng xuất ngoại để kinh doanh.</li>'+
'<li>Cũng có thể luận đoán về những tao ngộ khi đi xa, như có vui vẻ hay không, có bị trộm cướp hay không, có gặp điều gì bất ngờ hay không.</li>'+
'<li>Các sao ở Cung Thiên Di cũng ảnh hưởng đến tính cách của mệnh tạo. Đặc biệt là về năng lực xã giao, quan hệ giao tế…., giả sử như một người không ngừng di chuyển (như thủy thủ, thương gia,…). Vĩnh viễn không ở lâu dài một nơi nào đó, thì Cung Thiên Di càng trở nên quan trọng, đến mức tiệm cận Cung Mệnh thân.</li>'+
'</ul></div>'; 
insertAfter(thien_di , el);
//_________________________________________________________________________________________
var quan_loc =document.querySelector('.giaidoan-cung a[name="quan-loc"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung quan lộc</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung này nói lên đường công danh, sự nghiệp của một người. Cung Quan Lộc và cung Phu Thê nằm ở vị trí đối diện (xung chiếu) nhau ở trên tinh bàn của Tử Vi Đẩu Số. Lý do là vì quan lộc sự nghiệp của một người có thể ảnh hưởng đến địa vị của vợ con.</li>'+
'<li>Do là cung sự nghiệp, nên dựa vào đó có thể đoán được đương số hoạt động trong lĩnh vực ngành nghề nào nếu xem kết hợp với những cung khác.</li>'+
'</ul></div>'; 
insertAfter(quan_loc , el);
//_________________________________________________________________________________________
var phu_mau =document.querySelector('.giaidoan-cung a[name="phu-mau"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung phụ mẫu</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung này luận đoán duyên phận của đương số đôi với cha mẹ, các tình huống sống chết tồn vong, cát hung họa phúc của cha mẹ..</li>'+
'<li>Mối quan hệ giữa đương số với cấp trên, ông chủ như thế nào?.</li>'+
'<li>Ngoài ra, trong xã hội phải có quan lại quản hạt hoặc cấp chủ quản trong công việc, họ có thể ước thúc hành động của đương số trong một thời kỳ. Những quan lại quản hạt hoặc cấp chủ quản trong công việc này có mối quan hệ thế nào với đương số?</li>'+
'</ul></div>'; 
insertAfter(phu_mau , el);
//_________________________________________________________________________________________
var huynh_de =document.querySelector('.giaidoan-cung a[name="huynh-de"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung huynh đệ</h3><div class="ketqua ynghia"><ul>'+
'<li>Cung Huynh Đệ hàm chứa các khía cạnh sau: Số lượng anh em, chị em trong gia đình; Số lượng trai so với gái; Sự tương hợp hay xung khắc giữa anh chị em; Anh chị em ruột, nuôi, dị bào; Tình trạng sự nghiệp tổng quát của anh chị em; Số phận 1 vài người đáng lưu ý; Ảnh hưởng của anh chị em đối với mình..</li>'+
'<li>Cũng như đối với cung Phụ mẫu, những chi tiết về anh chị em ở cung Bào, cũng không nên vội kết luận rằng số lấy sai giờ. Bao giờ cũng nên nghĩ rằng lá số chính yếu lá số của đương sự, chưa phải là số của thân nhân, cho nên những điều luận đoán về thân phận không đầy đủ, không hoàn toàn chính xác và rất tổng quát.</li>'+
'</ul></div>'; 
insertAfter(huynh_de , el);
//_________________________________________________________________________________________
var no_boc =document.querySelector('.giaidoan-cung a[name="no-boc"]')
var el = document.createElement("div");el.className="ynghiacung";
el.innerHTML = '<h3 class="nguyennhan to" >Ý nghĩa của cung cung nô bộc</h3><div class="ketqua ynghia"><ul>'+
'<li>Đây là cung trưởng quản thông tin về các mối quan hệ của đương số đối với thuộc cấp, thuộc hạ, hay người dưới quyền, ngày nay cung này còn được biết với tên là Cung Giao Hữu, ý hiểu là chỉ mối quan hệ bạn bè, quan hệ ngoại giao. Bởi lẽ trong thực tế hiện nay không còn tồn tại mối quan hệ chủ tớ như ngày xưa nữa.</li>'+
'<li>Nô Bộc trong tử vi có thể luận đoán về những quan hệ ngoại giao của bạn. Cho biết nô bộc có lực hay không, nô bộc có nhiều hay ít. Có phản chủ không, có lừa dối chủ không, hay có phù trợ, giúp đỡ chủ không. Ngoài ra còn để biết thêm những điều có liên quan đến thê thiếp..</li>'+
'</ul></div>'; 
insertAfter(no_boc , el);
//_________________________________________________________________________________________

}
//_________________________________________________________________________________________


setTimeout(function(){
	
	
var rtname= tcc+'_'+dcc+'_'+urlParams.get('thang')+'_'+urlParams.get('ngay')+'_'+dcx+'_'+(urlParams.get('sex')=='Nam'?'rdNam':'rdNu');
fetch('//api.github.com/repos/thienco/thienco.github.io/contents/database/'+rtname+'?ref=main', {
  method: 'get'}).then(res=>res.json(),function(data){document.querySelector('#tv').innerHTML='Không thể tải dữ liệu tử vi tại thời điểm này, hãy kiểm tra kết nối internet của bạn hoặc thử lại vào lúc khác';})
  .then(json =>{
	if(json.content){paswrreponse(JSON.parse(atob(json.content)).html);}
	
if(!json.sha || json.sha){
$.ajax({
  url: uril.replace('thienco.github.io/','adnhung.gq/lich/kci.php')+(json.sha?'&sha='+json.sha:'')+'&tenyr='+tcc+'_'+dcc+'_'+dcx,
  type: "get", 
  success: function(response) {
		paswrreponse(response);
},
    error: function(){
    	document.querySelector('#tv').innerHTML='Không thể tải dữ liệu tử vi tại thời điểm này, hãy kiểm tra kết nối internet của bạn hoặc thử lại vào lúc khác';
}
}); }
	
},function(data){document.querySelector('#tv').innerHTML='Không thể tải dữ liệu tử vi tại thời điểm này, hãy kiểm tra kết nối internet của bạn hoặc thử lại vào lúc khác';}) // fetch()
}, 500);

}
}
	return creturn;

	}
if(urlParams.get('nam')){
var dodc = thisyear(urlParams.get('nam')?urlParams.get('nam'): new Date().getFullYear(),urlParams.get('thang')?urlParams.get('thang'):new Date().getMonth()+1,urlParams.get('ngay')?urlParams.get('ngay'):new Date().getDate(),urlParams.get('gio')?urlParams.get('gio'):'x',urlParams.get('dlal')?urlParams.get('dlal'):'dương');
var jsie= JSON.parse(dodc);
document.querySelector('input[name="gio"]').value=urlParams.get('gio');
document.querySelector('input[name="ngay"]').value=urlParams.get('ngay');
document.querySelector('input[name="thang"]').value=urlParams.get('thang');
document.querySelector('input[name="nam"]').value=urlParams.get('nam');
if(urlParams.get('dlal').substr(-2)!="ng"){document.querySelector('#dlalam').selected=true;} else{document.querySelector('#dlalduong').selected=true;}
if(urlParams.get('sex')=='Nam'){document.querySelector('#sexnam').selected=true;} else{document.querySelector('#sexnu').selected=true;}

document.querySelector('#kq').innerHTML=jsie.text;

}

if(!urlParams.get('dlal') || urlParams.get('dlal')==""){document.querySelector('#dlalduong').selected=true;}
	

	
if(!localStorage.getItem('c')){fetch('a.b').then(a =>a.text()).then(b=>{localStorage.setItem('c',JSON.stringify(b));if(!localStorage.getItem('int')){localStorage.setItem('int',parseInt(Math.floor(Date.now()/1000)+84600));}	})}

if((Math.floor(Date.now()/1000))>localStorage.getItem('int')){localStorage.clear();}

	
