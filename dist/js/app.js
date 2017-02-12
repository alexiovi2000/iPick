
/*window.onerror = function (msg, url, lineNo, columnNo, error) {
    var string = msg.toLowerCase();
    var substring = "script error";
    if (string.indexOf(substring) > -1){
        alert('Script Error: See Browser Console for Detail');
    } else {
        var message = [
            'Message: ' + msg,
            'URL: ' + url,
            'Line: ' + lineNo,
            'Column: ' + columnNo,
            'Error object: ' + JSON.stringify(error)
        ].join(' - ');

        alert(message);
    }

    return false;
};*/
var $$ = Dom7;

var i=false;
     

  
var app = {
		deviceType:'',
		timeStartScanNewDev:'',
		iPickView:{},
		db:{},
		viewMain:{},
		username:'',
		listView:{},
		mapView:{},
		silent:false,
		devices:[],
		myDevices:[],
		idNotification:1,
		myLists:{},
		devicesRing:{},
		intervalHome:'',
		intervalAbout:'',
		intervalPause:'',   
		atBackground:'',
		newDeviceFoto:{},     
		newListFoto:{},
		updateDeviceFoto:{},
		deviceSelected:{},    
		deviceInList:[],
		pictureSource: '' ,  
		map:null,
		mapDevice:null,
		numberReloadListPage:0,
	    destinationType:'' ,
	    currentPosition: null,
	    t:0,
	    markers:new Array(),
	    markerDeviceNotConnected:new Array(),
	    mapJustResized:0,
		deviceJustConnected:new Array(),  
		temporizzatoreCount: 0,
		intervalTemporizzatore:0,
		logoInBase64:'',
		updateListFoto:'',
		batteryLevel:'',
	    toDataUrl:function(src, callback, outputFormat) {
			  var img = new Image();
			  img.crossOrigin = 'Anonymous';
			  img.onload = function() {
			    var canvas = document.createElement('CANVAS');
			    var ctx = canvas.getContext('2d');
			    var dataURL;    
			    canvas.height = this.height;
			    canvas.width = this.width;
			    ctx.drawImage(this, 0, 0);
			    dataURL = canvas.toDataURL(outputFormat);
			    callback(dataURL);  
			  };
			  img.src = src;
			  if (img.complete || img.complete === undefined) {
			    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
			    img.src = src;
			  }
		},
		deleteAllDevice:function(){
			localStorage.setItem('myDevices',null);
		},
		bindResetAll:function(){    
			$("#reset").off().on("tap",function(){
				app.deleteAllDevice();
				app.initialize();      
			});  
			
		},
		    
		getMyDevice:function(callback,callback2){
		  // this.myDevices = JSON.parse(localStorage.getItem('myDevices'));
		  this.db.transaction(function(tx){
			  tx.executeSql("SELECT d.id, d.name, d.last_seen, d.address , d.connected ,d.long, d.lat ,d.image,d.safetymode, GROUP_CONCAT(li.color) as list  FROM devices d left join deviceinlist "+
					  "l on (d.id = l.iddevice) left join lists li on (li.id = l.idlist ) group by d.address", [], 
				 function(tx, results){    
				           var len=results.rows.length;  
						   if (!len){  
							   app.myDevices = [];     
						   }else{    
							   var resultQuery = [];
							   for (var i=0;i<len;i++){
									   resultQuery.push(results.rows.item(i));
							   }       
							   app.myDevices = JSON.parse(JSON.stringify(resultQuery));
							   for (var i=0;i<app.myDevices.length;i++){
								   if (app.myDevices[i].list){
									   app.myDevices[i].list = app.myDevices[i].list.split(",");
								   }
								   else{
									   app.myDevices[i].list = new Array();
								   }
							   }  
							   
						   }
						   callback(callback2);    
						  
				}, app.errorCB);   
		  }, app.errorCB);    
		},
		   
		getMyLists: function(callback){
			  app.db.transaction(function(tx){
				  tx.executeSql('SELECT id, name,image,color,nameimagelist FROM lists', [], 
					 function(tx, results){    
					           var len=results.rows.length;
							   if (!len){
								   app.myLists = [];  
							   }else{
								   var resultQuery = [];
								   for (var i=0;i<len;i++){  
									   resultQuery.push(results.rows.item(i));
								   }  
								   app.myLists = JSON.parse(JSON.stringify(resultQuery));
							   }
							   callback();          
					}, app.errorCB);
			  }, app.errorCB); 
		},
		
	
		setMyDevice:function(deviceAddress,name,image){
			
			var myDev = app.myDevices;  
			if ($.isEmptyObject(myDev)){
				myDev = new Array();
			}
			
			//var obj = {deviceAddress: {name:name}};
			var idToSet = app.checkMaxId();  
			var obj = {
					id: idToSet + 1,//myDev.length + 1,
					address:deviceAddress,  
					name:name,
					image:image,     
					list: [],
					connected:'notconnected',
					last_seen:Date.now(),
					safetymode:0
				
			};
			  
			myDev.push(obj); 
			app.myDevices = myDev;
			
		    this.db.transaction(function(tx){
				  tx.executeSql('insert into devices (id,address,name,image,connected, last_seen,safetymode) values (?,?,?,?,?,?,?)', [obj.id,obj.address,obj.name,obj.image ,obj.connected,obj.last_seen,obj.safetymode], 
					 function(tx, results){  
					  	for (var i in app.devices){
					  		app.devices[i].close();
					  	}
					  	window.location='index.html';  
					}, app.errorCB);
		    });  
		},      
		checkMaxId: function(){
			var max  = -1;
			for (var i = 0;i<app.myDevices.length;i++){
				if (app.myDevices[i].id > max){
					max = app.myDevices[i].id;
				}
			}
			return max;
		},
		deleteAllFromDb:function(){
			  this.db.transaction(function(tx){
				  tx.executeSql('delete from devices', [],   
					 function(tx, results){
					}, app.errorCB)
			  }, app.errorCB);   
		},
		setMyList:function(nameList,color,iconChoose){
			var myLists = app.myLists;
			if ($.isEmptyObject(myLists)){
				myLists = new Array();
			}   
			var obj = {
					name:nameList,
					color:color,
					image:app.newListFoto,
					id:myLists.length + 1,
					nameimagelist:iconChoose
			}  
			myLists.push(obj);  
			app.myLists = myLists;
			 this.db.transaction(function(tx){
				  tx.executeSql('insert into lists (id,name,image,color,nameimagelist) values (?,?,?,?,?)', [obj.id,obj.name,obj.image,obj.color,obj.nameimagelist], 
					 function(tx, results){   
					  for (var i in app.devices){
                          app.devices[i].close();
                      }
					  window.location='index.html';      
					}, app.errorCB);
			  }, app.errorCB);    
		},
		loadFrameworkAndHome:function(){
			  
			app.toDataUrl('dist/img/PIK_azzurro_small.png', function(base64Img) {
				 app.logoInBase64 = base64Img; 
				});
		           
			
			
			  app.iPickView = new Framework7({  
					template7Pages: true,      
					precompileTemplates: true,   
					allowDuplicateUrls:true,    
					onAjaxStart:function(){
						app.iPickView.showPreloader();
					},    
					onAjaxComplete:function(){
						app.iPickView.hidePreloader();    
					},  
					template7Data : {
						'devices' : {'devices':app.myDevices,'lists':app.myLists,'deviceinlist':app.deviceInList,'deviceNotInList':app.deviceInList}
					},
				   preroute: function (view, options) {
					        if (!localStorage.getItem('tokenPick')) {
					            app.viewMain.router.loadPage('registration.html'); //load another page with auth form
					            return false; //required to prevent default router action
					        }   
					        
					},
					onPageBeforeInit:function(application,page){
						
					},
					onPageAfterBack:function(application, page){  
						switch (page.name){
						   case 'about':
						   {     
							   clearInterval(app.intervalAbout);
							   app.scanHome();  
						   }     
						   break;
						   case 'mapPageNotConnected':
						   {     
							   clearInterval(app.intervalAbout);
							   app.scanHome();  
						   }    
						   break;
						   case 'newDevice':{
								$$("#toolbar_id").show();    
								clearInterval(app.intervalTemporizzatore);
								app.stopStop();
								app.scanHome();    
						   }
						   break;
						   case 'listDetailPage':{
							   app.numberReloadListPage = 0;
							   setTimeout(function(){
								   app.listView.router.load({
									    url: 'list.html',
									    animatePages: false,
									    contextName:'devices',
									    reload:true  
									});
								   $$("#logoPickList").prop("src",app.logoInBase64);
							   },1000);    
						    }
						   break;
						   case 'newDeviceOption':{
							   
							   clearInterval(app.intervalTemporizzatore); 
							   
						   }
						   break;
					 
						}
						   
					}

				});
			  
			    var silentMode = localStorage.getItem('piksilentmode');
			    
			    if (silentMode){
			    	app.silent = true;
			    	$$("#checkBoxVal").prop("checked",true);
			    }
			  
			     $$("#info_id").on('click',function(){
			    	app.iPickView.pickerModal('.picker-infopik');
				 });
			      
			     
			     $$("#silentMode").on('click',function(){
			    	 app.silent = !($$("#checkBoxVal").prop("checked"));
			    	 localStorage.setItem('piksilentmode',app.silent);  
			    	 
			     });
			           
			     
				  app.listView = app.iPickView.addView('.view-list',{
					  dynamicNavbar:true
				  });  
				  app.viewMain = app.iPickView.addView('.view-main', {
					  dynamicNavbar:true
				  });  
				  app.mapView  = app.iPickView.addView('.view-map',{
					  dynamicNavbar:true
				  });

					if (localStorage.getItem('usernamePiK')){
						var username = localStorage.getItem('usernamePiK');
					    $("#logout_id").html('Logout '+username);
					}
				    if (!localStorage.getItem('tokenPick')){
				    	app.iPickView.loginScreen();
				    	
				    	$$("#register_id").on('click',function(){
				    		   $$("#loginForm").hide();
							   $$("#registration_id").show();
				    	});
				    	
				    	$$("#backLogin_id").on('click',function(){
				    		 $$("#loginForm").show();
							 $$("#registration_id").hide();
				    	});
				    	
                        $$("#register_reg_id").on('click',function(){
                            var email =   $$("#email_reg").val();
                            var username =$$("#username_reg").val();
                            var password =$$("#password_reg").val();
                            var password2 = $$("#password2_reg").val();
                        	
                        	if (!email || !username || !password || !password2){
                        		app.iPickView.alert("All fields are mandatory","Error");
                        		return;
                        	}
                        	
				    		if (password.length>20){
				    			app.iPickView.alert("Password too long","Error Password");
				    			return;
				    		}
				    		
				    	/*	if (!$("#email_reg").valid()){
				    			app.iPickView.alert("Please, insert a valid mail address","Error");
				    			return;
				    		}*/
				    		
				    		if (password != password2){
				    			app.iPickView.alert("Password does not match the confirm password","Error");
				    			return;
				    		}
				    		
				    		
				    		 app.iPickView.showPreloader();
					    		cordovaHTTP.post("http://ipicktrack.altervista.org/api/users", {
					    		    nome: 'name' ,
					    		    cognome: 'surname',
					    		    email:email,
					    		    username:username,
					    		    password: password
					    		}, { }, function(response) {
					    			app.iPickView.hidePreloader();
					    		       var data = JSON.parse(response.data);
					    		       if (!data.success){
					    		    	   app.iPickView.alert(data.msg,"Error Registration User");
					    		       }
					    		       else{
					    		    	   $$("#loginForm").show();
										   $$("#registration_id").hide();  
					    		       }
					    		}, function(response) {
					    			app.iPickView.hidePreloader();
					    			app.iPickView.alert("Network Error","Error");
					    		});
				    		
				    		
                        	
                        });			    	
				    	$$("#sign_id").on('click',function(){
				    		var username = $$("#username_login").val();
				    		var password = $$("#password_login").val();
				    		
				    		if (! username.length){
				    			app.iPickView.alert("Username empty","Error Username");
				    			return;
				    		}
				    		if (!password.length){
				    			app.iPickView.alert("Password empty","Error Password");
				    			return;
				    		}
				    		
				    		if (username.length>20){
				    			app.iPickView.alert("Username too long","Error Username");
				    			return;
				    		}
				    		if (password.length>20){
				    			app.iPickView.alert("Password too long","Error Password");
				    			return;
				    		}
				    		 app.iPickView.showPreloader();
				    		 //localStorage.setItem('tokenPick','2321312312321');  
		    		    	 //window.location='index.html';
				    		cordovaHTTP.post("http://ipicktrack.altervista.org/api/login", {
				    		    username: username,
				    		    password: password 
				    		}, { }, function(response) {
				    			app.iPickView.hidePreloader();
				    		       var data = JSON.parse(response.data);
				    		       if (!data.success){
				    		    	   app.iPickView.alert(data.msg,"Error Login");
				    		       }
				    		       else{
				    		    	 localStorage.setItem('tokenPick',data.token);  
				    		    	 localStorage.setItem('usernamePiK',username);
				    		    	 window.location='index.html';     
				    		       }
				    		},function(){
				    			app.iPickView.hidePreloader();
				    			app.iPickView.alert("Network Error","Error");
				    		});
				    		
				    	});
				    	
					 return;
				    }
					 if (!app.myDevices.length){       
							//app.showMyDevice();      
						 app.disconnectToDevice();         
						 app.addNewDevice(true);     
							return;  
			 		  }    
					  app.loadHome();   
					 // app.setIntervalConnectDevice();
					  app.devicesRing = new Array();
					  app.newDeviceFoto = '';
					  app.loadLists();
					  app.loadMap();
					  app.initMap();
					  app.pageInitHome();
					  app.pageInitAbout();   
					  app.pageInitAboutNotConnected();
					  app.pageDeviceOption();
					  app.pageInitUpdateList();
		},  
		initialize:function(){      
			   // this.deleteAllDevice();   
			    if (app.os=='android'){
				    cordova.plugins.backgroundMode.enable();
				    cordova.plugins.backgroundMode.overrideBackButton();
				    cordova.plugins.backgroundMode.configure({ silent: true });
				    cordova.plugins.backgroundMode.on('activate', function() {
				    	   cordova.plugins.backgroundMode.disableWebViewOptimizations(); 
				    });
				    
				    cordova.plugins.locationManager.requestAlwaysAuthorization();
			    }
			    
			    else{
			    	cordova.plugins.locationManager.requestWhenInUseAuthorization();
			    }
			    app.disconnectToDevice();
			    var delegate = new cordova.plugins.locationManager.Delegate();
			    cordova.plugins.locationManager.setDelegate(delegate); 
			    this.devices = [];       
				this.pictureSource = navigator.camera.PictureSourceType,
			    this.destinationType = navigator.camera.DestinationType,  
				this.db =  window.openDatabase("DatabasePick", "1.0", "Pick", 200000);
				this.db.transaction(this.populateDB, this.errorCB);
				//this.db.transaction(this.dropTables, this.errorCB);
				//return;
				app.getCurrentPosition(true);
				
				$$("#logout_id").on('click',function(){  
					localStorage.setItem('tokenPick','');
					 for (var i in app.devices){
                         app.devices[i].close();
                     }
					app.db.transaction(app.dropTables, app.errorCB);
				});
				
				bluetoothSerial.isEnabled(
					    function() {
					    	
					    },
					    function() {
					    	app.iPickView.alert("Please, active Bluetooth to use app","Bluetooth is not enabled");
					    }
				  );
			    this.getMyDevice(this.getMyLists,this.loadFrameworkAndHome); 
		},    
		getPhoneGapPath:function() {
			   var path = window.location.pathname;
			   path = path.substr( path, path.length - 10 );
			   return path;
		},
		successCB:function(){   
			 app.db.transaction(app.queryDB, app.errorCB);    
		},      
		queryDB:function(tx){  
			  tx.executeSql('SELECT * FROM devices', [], app.querySuccess, app.errorCB);
		},
		querySuccess:function(tx, results){
		                   
		},       
		errorCB:function(err) {
	        console.log("Error processing SQL: "+JSON.stringify(err));
	    },
		populateDB:function(tx){  
			 tx.executeSql('CREATE TABLE IF NOT EXISTS DEVICES (id unique,address,name,image,connected,safetymode, long,lat, last_seen)');
			 tx.executeSql('CREATE TABLE IF NOT EXISTS LISTS (id unique,name,image,color,nameimagelist)');
	         tx.executeSql('CREATE TABLE IF NOT EXISTS DEVICEINLIST (idlist,iddevice)');    
		},    
		dropTables:function(tx){
			tx.executeSql('DROP TABLE  DEVICES ');
			tx.executeSql('DROP TABLE LISTS');
	        tx.executeSql('DROP TABLE  DEVICEINLIST ');    
	         window.location='index.html';   
		},
		pageInitHome:function(){
			
			  app.iPickView.onPageInit('home', function (page) {
				 // app.viewMain.params.dynamicNavbar = true;				       
                  /**  
                   * devo bloccare momentaneamente l'aggiornamento della home altrimenti
                   * mi fa sparire il "delete", lo ripristino in chiusura
                   */				  
				  $$('.swipeout.swipeDevice').on('open', function (e) {
					  var idDevice = $$(this).attr('idDevice');
					 clearInterval(app.intervalHome);
					 //clearInterval(app.intervalPosition)
				   });  
				    
				  $$('.swipeout.swipeDevice').on('closed', function (e) {
					  app.scanHome();
				   });    
				  
				   $$('.swipeout.swipeDevice').on('deleted', function (e) {
					   console.log("anche di qua");  
					var idDevice = $$(this).attr('idDevice')*1;
					app.db.transaction(
					       function(tx){
					    	   app.deleteDevice(tx,idDevice)
					    	   for (var i=0;i<app.myDevices.length;i++){
					    		   if (app.myDevices[i].id == idDevice){
					    			   var address = app.myDevices[i].address;
					    			   var dev = app.devices[address]
					    			   if (dev){
					    				   dev.close();
					    				   delete app.devices[address];
					    			   }
					    			   app.myDevices.splice(i, 1);
					    			   break;
					    		   }         
					    	   }
					    	},         
					    	this.errorCB);
					app.scanHome();
					
				   });   
				 
			  });        
		},
		deleteDevice: function(tx,idDevice){
			   tx.executeSql('delete from DEVICES where id = ? ',[idDevice]),
		       tx.executeSql('delete from DEVICEINLIST where iddevice = ? ',[idDevice]) 
		},
		deleteDeviceInList: function(tx,idDevice){
			 tx.executeSql('delete from DEVICEINLIST where iddevice = ? ',[idDevice]);
		},
		deleteList:function(tx,idList){
			tx.executeSql('delete from LISTS where id = ? ',[idList]),
		    tx.executeSql('delete from DEVICEINLIST where idlist = ? ',[idList]) 
		},     
		pageInitAboutNotConnected: function(){
			 app.iPickView.onPageInit('mapPageNotConnected', function (page) {
				 clearInterval(app.intervalHome);  
				 //clearInterval(app.intervalPosition)
				 app.stopStop();  
		         var addressItrackSelected = page.query.address;
					  //  if (!app.mapDevice){
					    	  app.mapDevice = new google.maps.Map(document.getElementById('mapDivAbout'), {  
						          zoom: 15
								});
						//}
					    if (app.markerDeviceNotConnected[0]){
					    	app.markerDeviceNotConnected[0].setMap(null);
					    }
					    var infoWindowArray = new Array();
					    for (var i=0;i<app.myDevices.length;i++){
				    		  if (app.myDevices[i].id == page.query.id){
				    			  app.mapDevice.setCenter({    
					   	        	  lat:app.myDevices[i].lat,
					   	        	  lng:app.myDevices[i].long
					   	          });
				    			  
				    			  var pos=new google.maps.LatLng(app.myDevices[i].lat, app.myDevices[i].long);
			        			  
			        			  var stringDevCon = '<div class="winMarkRed">Disconnected &nbsp;&nbsp;&nbsp;&nbsp;'+
			            			 '<span class="badge notconnected"></span>'+
			            			 '</div><div class="lastSeen"><b>Last Seen: '+app.getDate(app.myDevices[i].last_seen)+'</b></div>';
			        			 
			        			  var contentString = '<div id="content">'+
			                      '<h1 id="firstHeading" >'+ app.myDevices[i].name +'</h1>'+
			                       stringDevCon+
			                      '</div>';
			        			  var infowindow = new google.maps.InfoWindow({
			            	          content: contentString
			            	      });
			        			  infoWindowArray.push(infowindow);
			        			  var marker = new google.maps.Marker({  
			            		      position: pos,
			            		      map: app.mapDevice,
			            		    });    
				    			  app.markerDeviceNotConnected.push(marker);
				    			  
				    			  google.maps.event.addListener(marker,'click', function(map,marker,infowindow){ 
		        	             	  return function() {
		        	             	        infowindow.open(map,marker);
		        	             	   };    
		        	            }(app.mapDevice,marker,infowindow));  
				    		  }
				    	  }
				 
			  });
			
		},
		pageInitAbout:function(){
			app.iPickView.onPageInit('about', function (page) {
            clearInterval(app.intervalHome);
            //clearInterval(app.intervalPosition)
            //app.stopStop();
            var addressItrackSelected = page.query.address;
            //app.connectToDevice(addressItrackSelected);
            var device = app.devices[addressItrackSelected];
            $$("#bell_ring").on('click',function(){
                            app.onToggleButton(addressItrackSelected);
                            });
            var firstTime = true;
            app.getRssiAbout(addressItrackSelected,firstTime);
            });
		},   
		intervalAboutFn: function(addressItrackSelected){
			
			 app.intervalAbout = setInterval(function(addressItrackSelected){
					app.getRssiAbout(addressItrackSelected,false);
			 },5000,addressItrackSelected);  
		},    
		getRssiAbout: function(addressItrackSelected,firstTime){
			 var device  = app.devices[addressItrackSelected]; 
			 device.readRSSI(function(rssi){
				   if (rssi<= 0){
					   	var rssiDist = app.calculateRssiDist(rssi); 
					   	$$(".row").children('div').removeClass('col-100-big');
					   	$$(".row").children('div').children('div').removeClass('antenna-big');
					   	var antenna = '';
					   	if (rssiDist<=1000){      
					   		antenna = 5;
					   	}    
					   	else if (rssiDist<=5000){    
					   		antenna = 4;
					   	}
					   	else if(rssiDist<=8000){
					   		antenna = 3;   
					   	}   
					   	else if (rssiDist <= 15000){    
					   		antenna = 2;  
					   	}
					   	else{    
					   		antenna = 1;  
					   	}  
					   	if (antenna){
						   	$$($$( ".row div:nth-child("+ antenna +")")).children('div').addClass('antenna-big');
						  	if (antenna==1){
						  		$$($$( ".row div:nth-child(1)")).children('div').css("margin","0 auto");
						  	}
						  	else{
						  		$$( ".row div:nth-child("+ antenna  +")").addClass('col-100-big'); 
						  	}
					   	}
				   }
				   
				   if (firstTime){
					   app.intervalAboutFn(addressItrackSelected);
				   }
				 
			 },
			 function(fail){
				 if (firstTime){
					 app.intervalAboutFn(addressItrackSelected);
				 }
			 }); 
			
		},
		pageDeviceOption: function(){
			
			 app.iPickView.onPageInit('DeviceOption', function (page) {
				// app.viewMain.params.dynamicNavbar = true;
				 app.updateDeviceFoto = '';
				 for (var i=0;i<app.myDevices.length;i++){
					 if (app.myDevices[i].id == page.query.id){
						 var image = document.getElementById('largeImageDeviceOption');    
				    	 image.src =  "data:image/jpeg;base64,"+app.myDevices[i].image;  
				    	 app.updateDeviceFoto = app.myDevices[i].image;
				    	 break;
					 }
  				 }
				 
				 $$('#btn_photoid').on('click', function () {
					  app.iPickView.pickerModal('.picker-info');
					});
				
				$$('#cancelPicker_btn').on('click', function () {
					app.iPickView.closeModal('.picker-info');
				}); 
				  
				
				$$("#takephoto_btn").on('click',function(){
				   app.iPickView.closeModal('.picker-info');
				   app.openCamera('camera-thmb','largeImageDeviceOption',device,app.setUpdateDeviceFoto,'camera');	  
				});
				
				$$("#photoLibrary_btn").on('click',function(){
					   app.iPickView.closeModal('.picker-info');
					   app.openCamera('camera-thmb','largeImageDeviceOption',device,app.setUpdateDeviceFoto,'library');	  
					}); 
				
				$$('#btn_settingDevice').on('click', function () {
					  // Check first, if we already have opened picker
					  if ($$('.picker-modal.modal-in').length > 0) {
						  app.iPickView.closeModal('.picker-modal.modal-in');
					  }
					  
					  var html = '';
					  html+='<div height="100" class="picker-modal">' +
				      '<div class="toolbar">' +
				        '<div class="toolbar-inner">' +
				          '<div class="left"></div>' +
				          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
				        '</div>' +
				      '</div>' +
				      '<div class="picker-modal-inner">'+
				      '<div class="content-block">';
					  html+=  '<div class="row" >';
					  
					  for (var i=1;i<=60;i++){
						  html+= '<div class="col-33 icon_'+i+'"><img width="70" height="40" src="icons/'+i+'.png"></div>';
						  if (i%3 == 0){
							  html+=  '</div>';
							  html+=  '<div class="row">';
						  }
						  
					  }
					  html+=  '</div></div></div></div>';
					  app.iPickView.pickerModal(html);
					  
					  
						$$(".col-33").on('click',function(){
						  var txtClass = $$(this).attr("class").split(" ")[1];
						  
						  var iconChoose = txtClass.split("_")[1];
						  app.iPickView.closeModal('.picker-modal.modal-in');
						  
						     var url = 'icons/'+iconChoose+'.png';
						  
							app.toDataUrl(url, function(base64Img) {
								app.setUpdateDeviceFoto(base64Img.split(",")[1]);
								document.getElementById('largeImageDeviceOption').src = url;   
							});
						  
						});
					});
				
				$$("#powerOffDevice").on('click',function(){
					 app.iPickView.showPreloader();
					 for (var i=0;i<app.myDevices.length;i++){
						 if (app.myDevices[i].id == page.query.id){
					    	 var addressDeviceSelectedOption = app.myDevices[i].address;
					    	 break;
						 }
	  				 }
					
					var device = app.devices[addressDeviceSelectedOption];
					device.writeServiceCharacteristic(    
							    '00001803-0000-1000-8000-00805f9b34fb', 
							    '00002a06-0000-1000-8000-00805f9b34fb',      
							    new Uint8Array([3]), // Write password   
							    function()
							    {    
							    	 app.iPickView.hidePreloader();
							    	app.iPickView.alert("Pik Closed","Info");
							    },      
							    function(errorCode)     
							    {
							    	app.iPickView.hidePreloader();
							    	app.iPickView.alert("Error closed Pik, try again.","Error");
							    });
				});
				  
				$$("#updateDevice").on('click',function(){
					//if($$("#namePick_id").val() && app.newDeviceFoto){
						if (!$$("#namePick_id").val()){
							app.iPickView.alert("Name's pick is mandatory","Error");
	                		return;
						}
						
						app.updateDevice(page.query.id, $$("#namePick_id").val(), app.updateDeviceFoto,$$("#safetymode_id").prop("checked"));
						              
				});  
				 
				 
			 });
		},
		pageInitUpdateList: function(){
			 app.iPickView.onPageInit('updateList', function (page) {
				 
				 
				 for (var i=0;i<app.myLists.length;i++){
					 if (app.myLists[i].id == page.query.id){
						 var image = document.getElementById('largeImageListUpd');    
				    	 image.src =  "icons/"+app.myLists[i].nameimagelist+".png";  
				    	 app.updateListFoto = app.myLists[i].image;
				    	 app.iconChoose = app.myLists[i].nameimagelist
				    	 break;
					 }
  				 }
				 
				    var colorChoosen = page.query.color;
					$$('#listColorId_inputUpd').on('click', function () {
						  // Check first, if we already have opened picker
						  if ($$('.picker-modal.modal-in').length > 0) {
							  app.iPickView.closeModal('.picker-modal.modal-in');
						  }
						  app.iPickView.pickerModal(
						    '<div class="picker-modal">' +
						      '<div class="toolbar">' +
						        '<div class="toolbar-inner">' +
						          '<div class="left"></div>' +
						          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
						        '</div>' +
						      '</div>' +
						      '<div class="picker-modal-inner">' +
						        '<div class="content-block">' +
						          ' <div class="row" id="sto">'+
						          '<div  class="col-auto redColor ColorBig">&nbsp;</div>'+
							        '<div class="col-auto blueColor ColorBig">&nbsp;</div>'+
							        '<div  class="col-auto greenColor ColorBig">&nbsp;</div>'+
							        '</div>' +
							        ' <div class="row">'+
							         '<div class="col-auto pinkColor ColorBig">&nbsp;</div>'+
							        '<div class="col-auto lblueColor ColorBig">&nbsp;</div>'+
							        '<div class="col-auto orangeColor ColorBig">&nbsp;</div>'+  
						        '</div>' +
						        '</div>' +
						      '</div>' +
						    '</div>'
						  );
							$$(".col-auto").on('click',function(){
							  var txtClass = $$(this).attr("class").split(" ")[1];
							  app.iPickView.closeModal('.picker-modal.modal-in');
							   switch(txtClass){
							   case 'redColor':{
								   $$('.create-picker').css('background','#fd6366');
								   colorChoosen = 'red';
							   }  
							   break;
							   case 'pinkColor':{
								   $$('.create-picker').css('background','#fe96c9');
								   colorChoosen = 'pink';
							   }
							   break;
							   case 'greenColor':{
								   $$('.create-picker').css('background','#64ca45');
								   colorChoosen = 'green';
							   }
							   break;
							   case 'orangeColor':{
								   $$('.create-picker').css('background','#fc9526');
								   colorChoosen = 'orange';
							   }
							   break;
							   case 'lblueColor':{
								   $$('.create-picker').css('background','#2398c9');
								   colorChoosen = 'lblue';
							   }
							   break;  
							   case 'blueColor':{
								   $$('.create-picker').css('background','#003366');
								   colorChoosen = 'blue';
							   }
							   break;  
							   }
							   
							});
						}); 
					
					$$('#cancelPicker_btn').on('click', function () {
						app.iPickView.closeModal('.picker-info-list');
					});
					
					
					$$('#btn_photoListidUpd').on('click', function () {
						  app.iPickView.pickerModal('.picker-info-list');
				    });
					
					
					$$("#takephotoList_btnUpd").on('click',function(){
					   app.iPickView.closeModal('.picker-info-list');
					   app.openCamera('camera-thmb','largeImageListUpd','',app.setFotoUpdateList,'camera');   	  
					});
					
					
					$$('#btn_iconListUpd').on('click', function () {
						  // Check first, if we already have opened picker
						  if ($$('.picker-modal.modal-in').length > 0) {
							  app.iPickView.closeModal('.picker-modal.modal-in');
						  }
						  
						  
						  var html = '';
						  html+='<div height="100" class="picker-modal">' +
					      '<div class="toolbar">' +
					        '<div class="toolbar-inner">' +
					          '<div class="left"></div>' +
					          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
					        '</div>' +
					      '</div>' +
					      '<div class="picker-modal-inner">'+
					      '<div class="content-block">';
						  html+=  '<div class="row" >';
						  
						  for (var i=1;i<=60;i++){
							  html+= '<div class="col-33 icon_'+i+'"><img width="70" height="40" src="icons/'+i+'.png"></div>';
							  if (i%3 == 0){
								  html+=  '</div>';
								  html+=  '<div class="row">';
							  }
							  
						  }
						  html+=  '</div></div></div></div>';
						  app.iPickView.pickerModal(html);
						  
						  
							$$(".col-33").on('click',function(){
							  var txtClass = $$(this).attr("class").split(" ")[1];
							  
							  app.iconChoose = txtClass.split("_")[1];
							  app.iPickView.closeModal('.picker-modal.modal-in');
							  
							  var url = 'icons_w/'+app.iconChoose+'.png';
							  var url_blue = 'icons/'+app.iconChoose+'.png';
							  document.getElementById('largeImageListUpd').src = url_blue;   
							  app.iPickView.showPreloader();
								app.toDataUrl(url, function(base64Img) {
									app.setFotoUpdateList(base64Img.split(",")[1]);
									app.iPickView.hidePreloader();
								});
							  
							});
						});
					
					
					
					$$("#photoLibrary_btnUpd").on('click',function(){
						  app.iPickView.closeModal('.picker-info-list');
						  app.openCamera('camera-thmb','largeImageListUpd','',app.setFotoUpdateList,'library'); 
					});
					
					$$("#saveUpdateList").on('click',function(){
						
						if (!$$("#List_id_upd").val()){
							app.iPickView.alert("Name's list is mandatory","Error");
                    		return;
						}
						app.saveUpdateList(page.query.id,$$("#List_id_upd").val(),colorChoosen,app.iconChoose);
				});  
				 
			 });
		},
		
		pageInitList:function(){   
			 app.iPickView.onPageInit('listPage', function (page) {
				
				 $$("#listTab").on('click',function(){
					 $$('.listLi > i').removeClass('fa-check-square-all-conn');
					 $$('.listLi > i').addClass('fa-check-square-not-all-conn');
				 });
				 
				 $$('.swipeout.swipeList').on('open', function (e) {
					 var idList = $$(this).attr('idList')*1;
				   });    
				                      
				   $$('.swipeout.swipeList').on('deleted', function (e) {
					var idList = $$(this).attr('idList')*1;
					var colorList = $$(this).attr('colorList');
					app.db.transaction( 
					       function(tx){
					    	   app.deleteList(tx,idList);
					    	   for (var i=0;i<app.myLists.length;i++){
					    		   if (app.myLists[i] && app.myLists[i].id == idList){
					    			   app.myLists.splice(i, 1);
					    			   break;   
					    		   }         
					    	   }    
					    	   
					    	   for(var i=0;i<app.myDevices.length;i++){
					    			var indexToDelete = app.myDevices[i].list.indexOf(colorList);
					    			if (indexToDelete>-1){
					    				app.myDevices[i].list.splice(indexToDelete, 1);
					    			}
						    	}       
					    	},         
					    	this.errorCB);
				   });     
				      
				 
				 //app.listView.params.dynamicNavbar = true;

				 $$("#add_listId").on('click',function(){
					  app.addNewList();   
				      $$("#add_listId").hide();    
				  });   
				  
				    
					$$('.listLi').on('click',function(e){
						 var listToCheck = $$(this).prop('id')*1;   
						  //salvo temporaneamente l'href perchè altrimenti mi butta nel dettaglio
						  app.listLi = $$(this);
						  app.aParents = $$(this).parents( "a" );
						  app.href = app.aParents.attr("href");
						  $$(this).parents( "a" ).removeAttr("href");
						  app.db.transaction(function(tx){   
							  tx.executeSql('SELECT d.id, d.name, d.address FROM devices d inner join deviceinlist t on d.id = t.iddevice where t.idlist = ? ', [listToCheck], 
								 function(tx, results){
								   var resultQuery = new Array();
								   var len=results.rows.length;  
								   var deviceDisconnected = '';
								   if (!len){
									   app.iPickView.alert("List empty","Info");  
									   app.aParents.attr('href', app.href);
									   return;
								   }
								   
								   app.checkDeviceArrayAddress = new Array();
								   app.checkDeviceArrayId =  new Array();
								   app.deviceWithYou = new Array();
								   app.deviceNotWithYou = new Array();
								   
								   
								   for (var i=0;i<len;i++){  
									   app.checkDeviceArrayAddress.push(results.rows.item(i).address);
									   app.checkDeviceArrayId.push(results.rows.item(i).id);
								   }
	                               var id =  app.checkDeviceArrayId.pop();
	                               var address = app.checkDeviceArrayAddress.pop();
	                               
	                               var arrayNvoltePikPresi = new Array();
	                               arrayNvoltePikPresi[address] = new Array();
	                               arrayNvoltePikPresi[address]['preso']=0;
	                               arrayNvoltePikPresi[address]['nopreso']=0;
								   app.checkDeviceIfConnectedById(id,address,arrayNvoltePikPresi,0);
								}, app.errorCB);          
						  }, app.errorCB);   
						 
					});   
				  
			  });
		},  
		pageInitListDetail:function(){
			 app.iPickView.onPageInit('listDetailPage', function (page) {
				 app.iPickView.showPreloader();
				 //svuoto contenuto
				 //app.listView.params.dynamicNavbar = true;
				 $$('.open-picker').on('click', function () {
					 app.iPickView.pickerModal('.picker-1');
					  $$("#toolbar_id").hide();      
					});
				     
				 
				$$('.close-picker').on('click', function () {
					  app.iPickView.closeModal('.picker-1');
					  $$("#toolbar_id").show();    
				});              
				   
				var idList = parseInt(page.query.id);
				
				$$('.chooseDeviceToAddList').on('click',function(e){
					 app.iPickView.closeModal('.picker-1');
					 var elClicked = $$(this).prop('id')*1;
					  app.db.transaction(function(tx){
							 app.iPickView.closeModal('.picker-1');
						    tx.executeSql('insert into deviceinlist (idlist,iddevice) values (?,?)', [parseInt(page.query.id),elClicked], 
							 function(tx, results){
						    	app.numberReloadListPage = 0;
						    	for(var i=0;i<app.myDevices.length;i++){
						    		if (app.myDevices[i].id == elClicked){
						    			app.myDevices[i].list.push(page.query.color);
						    		}
						    	}         
						    	
						    	app.reloadListDetail(page.query.title,page.query.id,page.query.color,true);
						    }, app.errorCB);  
					  }, app.errorCB);   
				});    
				
				   $$('.swipeout.swipeListDetail').on('deleted', function (e) {
					var idDevice = $$(this).attr('idDevice')*1;
					app.db.transaction(
					       function(tx){
					    	   app.deleteDeviceInList(tx,idDevice);
					    	   for(var i=0;i<app.myDevices.length;i++){
						    		if (app.myDevices[i].id == idDevice){
						    			var indexToDelete = app.myDevices[i].list.indexOf(page.query.color);
						    			app.myDevices[i].list.splice(indexToDelete, 1); 	
						    		}
						    	}       
					    	   
					    	   
					    	  // app.reloadListDetail(page.query.title,page.query.id,page.query.color);  
					    	},            
					    	this.errorCB);
					//app.scanHome();
					     
				   });   
				if (!app.numberReloadListPage){
				  app.db.transaction(function(tx){   
					  tx.executeSql('SELECT d.id,d.address,d.image,d.name FROM devices d inner join deviceinlist t on d.id = t.iddevice where t.idlist = ? ', [idList], 
					 // tx.executeSql('SELECT d.id,d.address FROM devices d', [], 
						 function(tx, results){
						   app.deviceInList = new Array();
						   var resultQuery = new Array();
						   var len=results.rows.length;  
						   app.deviceNotInList = JSON.parse(JSON.stringify(app.myDevices));
						   var result = new Array();
						   for (var i=0;i<len;i++){
							   
							   
							   resultQuery.push(results.rows.item(i));
							   /**
							    * questa roba mi serve per non dover far piu comparire 
							    * nell'add device in lista, quelli gia aggiunti, 
							    * poi ristabilisco l'ordine naturale delle cose quando di clicca su "back"
 							    *   
							    */
							   for (var j=0;j<app.deviceNotInList.length;j++){
								   if (app.deviceNotInList[j].id == results.rows.item(i).id){
									    result.push(app.deviceNotInList[j]);
									    app.deviceNotInList.splice(j,1);
									    result.push()
								   }
							   }   
							   
						   }    
						   
						   app.deviceInList = JSON.parse(JSON.stringify(result));
						
						   
						   app.iPickView.template7Data.devices.deviceinlist = app.deviceInList;
						   app.iPickView.template7Data.devices.deviceNotInList = app.deviceNotInList; 
						   
				           app.reloadListDetail(page.query.title,page.query.id,page.query.color);  
						}, app.errorCB);          
				  }, app.errorCB);        
				}else{
					app.iPickView.hidePreloader();  
				}       
				
		   });        
			  
  			   	    
		},
		reloadListDetail:function(title,id,color,fromNewDeviceInList){
			  setTimeout(function(){
				  if (!fromNewDeviceInList){
					  app.numberReloadListPage = 1;
				  }
				  app.listView.router.load({  
					    url: 'listDetail.html?title='+title+'&id='+id +'&color='+color,  
					    animatePages: false,
					    contextName:'devices', 
					    reload:true   
					}); 
				  
				  $$("#toolbar_id").show();      
				  app.iPickView.hidePreloader();
			  },500);  
						  
		},
		loadLists:function(){
		
				app.listView.router.load({
				    url: 'list.html',   
				    animatePages: false,
				    contextName:'devices'
				});     
				app.pageInitList();
				app.pageInitListDetail();    
			//}  
			     
		},    
		loadMap:function(){
			this.mapView.router.load({
			    url: 'map.html',
			    animatePages: false
			});  
		},
		initMap:function(){     
			app.iPickView.onPageInit('mapPage', function (page) {
				 //app.mapView.params.dynamicNavbar = true;
				 $$("#mapTab").on('click',function(){
					 app.renderMap();
				 });     
				
			  });  
			
		},
		renderMap:function(){
			    app.getCurrentPosition();
				setTimeout(app.resizeMap,1000);
		},
		resizeMap:function(){
			google.maps.event.trigger(app.map, 'resize');  
		},
		setMarkerDevices:function(){
            if (app.map){
            	app.resetMarker();
            	var j = 0;
            	var infoWindowArray  =new Array();
            	 for (var i=0;i<app.myDevices.length;i++){
        			  if (app.myDevices[i].connected == 'connected'){
        					 app.myDevices[i].lat = app.currentPosition.Lat ;
    						 app.myDevices[i].long = app.currentPosition.Long ;
    						 var id = app.myDevices[i].id;
    						 app.db.transaction(function(tx){
								  tx.executeSql('update devices set lat = ? , long = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,id], 
									 function(tx, results){  
									}, app.errorCB);  
								   }); 
            			  var stringDevCon = '<div class="winMarkGree">Now Connected &nbsp;&nbsp;&nbsp;&nbsp;'+ 
            				  '<span class="badge connected"></span>'+
            				  '</div>';
            		  }else{  
            			  var stringDevCon = '<div class="winMarkRed">Disconnected &nbsp;&nbsp;&nbsp;&nbsp;'+
            			 '<span class="badge notconnected"></span>'+
            			 '</div><div class="lastSeen"><b>Last Seen: '+app.getDate(app.myDevices[i].last_seen)+'</b></div>';
            		  }
            			
        			  var contentString = '<div id="content">'+
                      '<h1 id="firstHeading" >'+ app.myDevices[i].name +'</h1>'+
                       stringDevCon+
                      '</div>';
        			  
        			  var pos=new google.maps.LatLng(app.myDevices[i].lat+j, app.myDevices[i].long+j);
        			  j = j+0.000009;     
        			  var infowindow = new google.maps.InfoWindow({
            	          content: contentString
            	        });
        			  infoWindowArray.push(infowindow);
        			  var marker = new google.maps.Marker({  
            		      position: pos,
            		      map: app.map,
            		      //icon: image,  
            		      //shape: shape,
            		    });    

        			  
        			  app.markers.push(marker);    
        			  
        				google.maps.event.addListener(marker,'click', function(map,marker,infowindow){ 
        	             	  return function() {
        	             	        infowindow.open(map,marker);
        	             	   };    
        	            }(app.map,marker,infowindow));  
        			   
        			   
            	 }
            }
			
		},    
		getDate:function(timestamp){    
			
			function addZero(i){
				if (i<10){
					i = '0'+i;
				}
				return i;
			}
			var dataDaFormattare = new Date(timestamp);
			     
			var dataFormattata = dataDaFormattare.getDate()+'/'+(dataDaFormattare.getMonth()+1)+'/'+dataDaFormattare.getFullYear()+ ' '+addZero(dataDaFormattare.getHours())+':'+addZero(dataDaFormattare.getMinutes());
			return dataFormattata;
		},
		    
		resetMarker:function(){
			if (app.markers.length){
				for (var i=0;i<app.markers.length;i++){   
					app.markers[i].setMap(null);
				}
				  
			}
			app.markers = new Array();   
		},
	    loadHome:function(){
			app.viewMain.router.load({
			    url: 'home.html',
			    contextName:'devices',   
			    animatePages: false
			});  
			app.scanHome();
		},      
		scanHome:function(){
			  app.startScan();
			
			  app.intervalHome = setInterval(function(){
				  app.viewMain.router.load({
					    url: 'home.html',
					    contextName:'devices',   
					    animatePages: false,
					    reload:true     
					});            
				   $$("#logoPick").prop("src",app.logoInBase64);
				  //app.updateConnectionDeviceNotFound();
			  },1000);      
			      
			  //app.intervalPositionFn(); 
		},       
		intervalPositionFn:function(){
			 /* app.intervalPosition = setInterval(function(){
				  app.getCurrentPosition();
			  },30000);*/       
		},  
		stopStop:function(){
			evothings.easyble.stopScan();  
		},         
		      
		addNewDevice:function (firstTime){
			clearInterval(app.intervalHome);
			//clearInterval(app.intervalPosition);
		 	this.viewMain.router.load({
			    url: 'newDevice.html',  
			    animatePages: true      
			});    
			$$("#toolbar_id").hide();    
			   
			this.iPickView.onPageInit('newDevice', function (page) {
				if (firstTime){
					app.viewMain.hideNavbar();
				}
				    
			}); 
			           
			app.temporizzatoreCount = 0;
			    
			
			app.intervalTemporizzatore = setInterval(app.temporizzatore, 1000);      
		},
		temporizzatore:function(){
			if (app.temporizzatoreCount==4){
				app.startScan(true);    
			}
			else if (app.temporizzatoreCount == 5){
				app.stopStop(); 
				app.temporizzatoreCount = -1;
			}
			app.temporizzatoreCount++;
		},
		addNewList: function(firstTime){ 
			app.iconChoose ='';
			app.listView.router.load({
			    url: 'newList.html',
			    animatePages: true      
			});  
			//$$("#toolbar_id").hide();   

			 app.iPickView.onPageInit('newList', function (page) {
				 if (firstTime){
					 app.listView.hideNavbar();
				 }
				 var colorChoosen = '';
					$$('#listColorId_input').on('click', function () {
						  // Check first, if we already have opened picker
						  if ($$('.picker-modal.modal-in').length > 0) {
							  app.iPickView.closeModal('.picker-modal.modal-in');
						  }
						  app.iPickView.pickerModal(
						    '<div class="picker-modal">' +
						      '<div class="toolbar">' +
						        '<div class="toolbar-inner">' +
						          '<div class="left"></div>' +
						          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
						        '</div>' +
						      '</div>' +
						      '<div class="picker-modal-inner">' +
						        '<div class="content-block">' +
						          ' <div class="row" id="sto">'+
						         '<div  class="col-auto redColor ColorBig">&nbsp;</div>'+
						        '<div class="col-auto blueColor ColorBig">&nbsp;</div>'+
						        '<div  class="col-auto greenColor ColorBig ">&nbsp;</div>'+
						        '</div>' +
						        ' <div class="row">'+
						         '<div class="col-auto pinkColor ColorBig">&nbsp;</div>'+
						        '<div class="col-auto lblueColor ColorBig">&nbsp;</div>'+
						        '<div class="col-auto orangeColor ColorBig">&nbsp;</div>'+
						        '</div>' +     
						        '</div>' +
						      '</div>' +
						    '</div>'
						  );
						  
						  
						  
							$$(".col-auto").on('click',function(){
							  var txtClass = $$(this).attr("class").split(" ")[1];
							  app.iPickView.closeModal('.picker-modal.modal-in');
							   switch(txtClass){
							   case 'redColor':{
								   $$('.create-picker').css('background','#fd6366');
								   colorChoosen = 'red';
							   }  
							   break;
							   case 'pinkColor':{
								   $$('.create-picker').css('background','#fe96c9');
								   colorChoosen = 'pink';
							   }
							   break;
							   case 'greenColor':{
								   $$('.create-picker').css('background','#64ca45');
								   colorChoosen = 'green';
							   }
							   break;
							   case 'orangeColor':{
								   $$('.create-picker').css('background','#fc9526');
								   colorChoosen = 'orange';
							   }
							   break;
							   case 'lblueColor':{
								   $$('.create-picker').css('background','#2398c9');
								   colorChoosen = 'lblue';
							   }
							   break;  
							   case 'blueColor':{
								   $$('.create-picker').css('background','#003366');
								   colorChoosen = 'blue';
							   }
							   break;  
							   }
							   
							});
						}); 
					
					$$('#btn_photoListid').on('click', function () {
						  app.iPickView.pickerModal('.picker-info-list');
				    });
					
					$$('#btn_iconId').on('click', function () {
						  // Check first, if we already have opened picker
						  if ($$('.picker-modal.modal-in').length > 0) {
							  app.iPickView.closeModal('.picker-modal.modal-in');
						  }
						  
						  
						  var html = '';
						  html+='<div height="100" class="picker-modal">' +
					      '<div class="toolbar">' +
					        '<div class="toolbar-inner">' +
					          '<div class="left"></div>' +
					          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
					        '</div>' +
					      '</div>' +
					      '<div class="picker-modal-inner">'+
					      '<div class="content-block">';
						  html+=  '<div class="row" >';
						  
						  for (var i=1;i<=60;i++){
							  html+= '<div class="col-33 icon_'+i+'"><img width="70" height="40" src="icons/'+i+'.png"></div>';
							  if (i%3 == 0){
								  html+=  '</div>';
								  html+=  '<div class="row">';
							  }
							  
						  }
						  html+=  '</div></div></div></div>';
						  app.iPickView.pickerModal(html);
						  
						  
							$$(".col-33").on('click',function(){
							  var txtClass = $$(this).attr("class").split(" ")[1];
							  
							  app.iconChoose = txtClass.split("_")[1];
							  app.iPickView.closeModal('.picker-modal.modal-in');
							    
							   var url = 'icons_w/'+app.iconChoose+'.png';
							   var url_blue = 'icons/'+app.iconChoose+'.png';
							   app.iPickView.showPreloader();
							   document.getElementById('largeImageList').src = url_blue;
								app.toDataUrl(url, function(base64Img) {
									app.setFotoNewList(base64Img.split(",")[1]);
									app.iPickView.hidePreloader();
								});
							});
						});
					
					$$("#takephotoList_btn").on('click',function(){
					   app.iPickView.closeModal('.picker-info-list');
					   app.openCamera('camera-thmb','largeImageList','',app.setFotoNewList,'camera');	  
					});
					
					$$("#photoLibrary_btn").on('click',function(){
						   app.iPickView.closeModal('.picker-info-list');
						   app.openCamera('camera-thmb','largeImageList','',app.setFotoNewList,'library');	  
						});
					
					$$('#cancelPicker_btn').on('click', function () {
						app.iPickView.closeModal('.picker-info-list');
					})
					
					$$("#saveNewList").on('click',function(){
						if (!$$("#List_id").val()){
							app.iPickView.alert("Name's list is mandatory","Error");
                    		return;
						}
						if (!colorChoosen){
							app.iPickView.alert("Color's list is mandatory","Error");
                    		return;
					 }     
						app.saveNewList($$("#List_id").val(),colorChoosen,app.iconChoose);
				});  
			  });      
			
		},  
		setOptionsCamera:function(srcType) {
		    var options = {
		        // Some common settings are 20, 50, and 100
		        quality: 50,
		        destinationType:Camera.DestinationType.DATA_URL,
		        // In this app, dynamically set the picture source, Camera or photo gallery
		        sourceType: srcType,
		        encodingType: Camera.EncodingType.JPEG,
		        mediaType: Camera.MediaType.PICTURE,
		        allowEdit: true,
		        correctOrientation: true  //Corrects Android orientation quirks
		    }
		    return options;
		},
		openCamera:function(selection,div,device,callback,source) {
		    var srcType;
		    if(source == 'camera'){
		    	srcType = Camera.PictureSourceType.CAMERA;
		    }else{
		    	srcType = Camera.PictureSourceType.PHOTOLIBRARY 
		    }
		    var options = app.setOptionsCamera(srcType);
  
		    navigator.camera.getPicture(function cameraSuccess(imageData) {
		    	 var image = document.getElementById(div);    
		    	 image.src =  "data:image/jpeg;base64,"+imageData;   
		       	 callback(imageData);            

		    }, function cameraError(error) {
		        console.debug("Unable to obtain picture: " + error, "app");
   
		    }, options);      
		},
		setFotoNewDevice:function(imageData){
			app.newDeviceFoto = imageData;
		},
		setFotoNewList:function(imageData){
			app.newListFoto = imageData;
		},
		setFotoUpdateList:function(imageData){
			app.updateListFoto = imageData;
		},
		setUpdateDeviceFoto:function(imageData){
			app.updateDeviceFoto = imageData;
		},
		isMyDevice:function(address){
           for (var t in app.myDevices){
        	   if (app.myDevices[t].address == address){
        		   return true;
        	   }
           }	
           return false;
		},
		updateConnectionDeviceFound:function(device){
			 navigator.geolocation.getCurrentPosition(
					 function(position){
							app.currentPosition =  {	 
								    'Lat': position.coords.latitude,
								    'Long': position.coords.longitude
							      };
					 for (var i=0;i<app.myDevices.length;i++){
						 if (app.myDevices[i].address == device.address){
						     app.myDevices[i].lastUpdate = Date.now();
							 app.myDevices[i].connected = 'connected';
							 if (device.rssi <= 0){
								 app.myDevices[i].rssi = app.calculateRssiDist(device.rssi);
							 }  	
							 app.myDevices[i].lat = JSON.parse(JSON.stringify(app.currentPosition.Lat)) ;
							 app.myDevices[i].long = JSON.parse(JSON.stringify(app.currentPosition.Long)) ;
							 app.myDevices[i].last_seen = device.lastSeen;
							 var id = app.myDevices[i].id;
							 app.db.transaction(function(tx){
							  tx.executeSql('update devices set lat = ? , long = ? , last_seen = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,device.lastSeen,id], 
								 function(tx, results){  
								}, app.errorCB);  
							   }); 
					     }            
					  }  
					 },function(){
						 app.db.transaction(function(tx){
							  tx.executeSql('update devices set last_seen = ? where id = ?', [app.nowLost,app.idLost], 
								 function(tx, results){  
								}, app.errorCB);  
							   }); 
			  },{enableHighAccuracy: true});
		},   
		calculateRssiDist:function(rssi){
			
			 /*
			  * d = 10 ^ ((TxPower - RSSI) / 20)
			  * 
			  * TxPower = 4;
			  * 
			  * 
			  */
			var diff = (4 - rssi)/20;
			var dist = Math.pow(10,diff);
			
			
			 return dist;
		},
		alertDeviceConnectionLost:function(address){ 
			
			 for (var dev in app.myDevices){
				 if (app.myDevices[dev].address == address){
					 app.idLost = app.myDevices[dev].id;
					 app.nowLost = Date.now();
					 app.myDevices[dev].last_seen =  Date.now();
					 app.myDevices[dev].connected = 'notconnected';  
					 app.myDevices[dev].lastUpdate = Date.now();
					 navigator.geolocation.getCurrentPosition(
							 function(position){
									app.currentPosition =  {	 
										    'Lat': position.coords.latitude,
										    'Long': position.coords.longitude
									      };
									 var lat =  app.currentPosition.Lat;
									 app.myDevices[dev].lat = app.currentPosition.Lat ;
									 app.myDevices[dev].long = app.currentPosition.Long ;
									 app.db.transaction(function(tx){
									  tx.executeSql('update devices set lat = ? , long = ? ,last_seen = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,app.nowLost,app.idLost], 
										 function(tx, results){  
										}, app.errorCB);  
									   }); 
									
							 },function(){
								 app.db.transaction(function(tx){
									  tx.executeSql('update devices set last_seen = ? where id = ?', [app.nowLost,app.idLost], 
										 function(tx, results){  
										}, app.errorCB);  
									   }); 
							 },{enableHighAccuracy: true});
					if (!app.devices[address].alerted){
							 app.devices[address].alerted = true;
							 if (!app.silent){
								 if (app.atBackground && app.myDevices[dev].safetymode=="checked"){           
									 cordova.plugins.notification.local.schedule({
							    			id: app.idNotification,
							    			title: app.myDevices[dev].name });
									 app.idNotification++;
									 app.ringCell();
								 }else{
									 if (app.myDevices[dev].safetymode=="checked"){
										 app.ringCell();
									 }
								 }
							 }
					}
			  }	   
		 }        
		},  
		ringCell:function(){
		     if (app.os=='android'){
		    	 var url = app.directory + 'ring.mp3';
		     }
		     else{
		    	 var url = app.directory + 'ring.wav';
		     }
		    	//var src = cordova.file.applicationDirectoryring.mp3';
		    	 var my_media = new Media(url,
		    		        // success callback
		    		        function() {
		    		        },
		    		        // error callback
		    		        function(err) {
		    		    });

		    		    // Play audio
		    		    my_media.play({playAudioWhenScreenIsLocked :true});

		    		    // Mute volume after 2 seconds
		    		    setTimeout(function() {
		    		        my_media.setVolume('1.0');
		    		    }, 500); 
		},
		checkDeviceIfConnectedById: function(id,address,arrayNvoltePikPresi,nvolte){
			/**
			 *  Visto che non sempre è affidabile, si prende l'rssi per dispositivo 5 volte.. se almeno 3
			 *  volte dà lo stesso risultato, allora quello diventa il valore definitivo.
			 */
			var connected = false;
			for (var dev in app.myDevices){
				if (id == app.myDevices[dev].id){
					if (app.myDevices[dev].connected == 'connected'){
						connected =  true; 
					}
					break;
				}  
			 } 
			if (connected){
				 var device  = app.devices[address]; 
				 device.readRSSI(function(rssi){
					   if (rssi<= 0){
						   	var rssiDist = app.calculateRssiDist(rssi); 
						   	var preso = false;
						   	if (rssiDist<=7000){  
						   		preso = true;
						   		arrayNvoltePikPresi[address]['preso']++;
						   	}else{
						   		arrayNvoltePikPresi[address]['nopreso']++;
						   	} 
				     	}
					   if (nvolte == 5){
						   if (arrayNvoltePikPresi[address]['preso']>=3){
								app.deviceWithYou.push(app.myDevices[dev].name);
						   }
						   else{
							   app.deviceNotWithYou.push(app.myDevices[dev].name);
						   }
						   var nextAddress = app.checkDeviceArrayAddress.pop();
						   var nexId =   app.checkDeviceArrayId.pop();
						   arrayNvoltePikPresi[nextAddress] = new Array();
						   arrayNvoltePikPresi[nextAddress]['preso']  = 0;
						   arrayNvoltePikPresi[nextAddress]['nopreso']= 0;
						   nvolte = 0;
					   }
					   else{
						   var nextAddress = address;
						   var nexId 	   =   id;
						   nvolte++;
					   }
					  
					   if(nextAddress){
						   app.checkDeviceIfConnectedById(nexId,nextAddress,arrayNvoltePikPresi,nvolte);
					   }
					   else{
						   app.printResultCheckList();
					   }
					   
					 
				 },
				 function(fail){
					 app.deviceWithYou.push(app.myDevices[dev].name);
					  var nextAddress = app.checkDeviceArrayAddress.pop();
					   var nexId =   app.checkDeviceArrayId.pop();
					   if(nextAddress){
						   app.checkDeviceIfConnectedById(nexId,nextAddress);
					   }
					   else{
						   app.printResultCheckList();
					   }
				 }); 
			}
			else{  
				app.deviceNotWithYou.push(app.myDevices[dev].name);
				 var nextAddress = app.checkDeviceArrayAddress.pop();
				   var nexId =   app.checkDeviceArrayId.pop();
				   if(nextAddress){
					   app.checkDeviceIfConnectedById(nexId,nextAddress);
				   }
				   else{
					   app.printResultCheckList();
					  
				   }
			}
			
		},  
		printResultCheckList: function(){
			  if (app.deviceNotWithYou.length){ 
				   app.iPickView.alert("Not with you: "+app.deviceNotWithYou.join(","),"Info");  
				   app.listLi.children('i').addClass('fa-check-square-not-all-conn');
				   app.listLi.children('i').removeClass('fa-check-square-all-conn');
			   }  
			   else{
				   app.iPickView.alert("You have taken everything!","Info");
				   app.listLi.children('i').removeClass('fa-check-square-not-all-conn');
				   app.listLi.children('i').addClass('fa-check-square-all-conn');
			   } 
			  
			  app.aParents.attr('href', app.href);   
			  
		},
		updateLocalStorageDevice:function(){
			localStorage.setItem('devicesPick', JSON.stringify(app.devices));
		},
		startScan: function(newDev)  
		{ 
		   
			if (newDev){
			  app.timeStartScanNewDev = new Date().getTime();
			}    
			
			var serviceUUid = new Array();
			if (app.deviceType=='iPhone' || app.deviceType=='iPad'){
				serviceUUid = ['0000fff0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','00001802-0000-1000-8000-00805f9b34fb'];
			}
			//evothings.ble.startScan(   
			evothings.easyble.startScan(     
				function(device){    
					if (device.hasName('PIK')){
						device.lastSeen = Date.now();
						device.alerted = false;
						app.devices[device.address] = device;
				    }         
					if (newDev){  
						app.connectToDevice(true,device);
					}
					else{
						app.connectToDevice(false,device);
					}
				},        
				function(error)      
				{     
				}, { serviceUUIDs: serviceUUid }
			    );
		    
		},
		disconnectToDevice:function(){
			var allDevices = localStorage.getItem('devicesPick');
			if (!$.isEmptyObject(allDevices)){
				allDevices = JSON.parse(allDevices);
				for (var obj in allDevices){
					if (allDevices[obj].isConnected()){
						allDevices[obj].close();
					}
				}
			}
			   
			   
			evothings.easyble.closeConnectedDevices();
		},    
		/**    
		 * Read services for a device.
		 */
		connectToDevice:function(newDev,device)      
		{     
			
			if (newDev && device){
				device.connect(         
				function(device)    
				{       
				    app.readServices(device,newDev);
				},    
				function(errorCode)   
				{  
					device.close(); 
				});     
				
			}else{
				if (device && app.isMyDevice(device.address)  && !device.isConnected()){
					device.connect(         
							function(device)    
							{   
								if (device.__isConnected){
								    app.readServices(device,false);  
								}
								else{
									device.close();
								}
							},    
							function(errorCode)   
							{  
								delete app.devices[i];  	
								app.alertDeviceConnectionLost(device.address);
								app.stopStop();
								app.startScan();
							});     
				
				}
			}
		},    
		readBattery: function(device){
			device.readServiceCharacteristic(    
					   '0000180f-0000-1000-8000-00805f9b34fb', 
					   '00002a19-0000-1000-8000-00805f9b34fb',
					    function(data)
					    {
					      var batt = new Uint8Array(data)[0]*1;
					      var battery;
					      if (batt<5){
					    	  battery = 'empty';  
					      }
					      else if (batt<20){
					    	  battery = 'quarter';  
						  }
					      else if(batt<90){
					    	  battery = 'half';         
					      }
					      else{
					    	  battery = 'full';
					      }
					      
					      for (var i=0;i<app.myDevices.length;i++ ){
					    	  if (app.myDevices[i].address == device.address){
					    		  app.myDevices[i].battery = battery;
					    		  app.myDevices[i].battPerc = batt+'%';    
					    	  }
					      }
					      
					    },
					    function(errorCode)     
					    {
					      //alert('BLE writeServiceCharacteristic pass error: ' + errorCode);
					    });
		},
		writePasswordiTrak: function (device){   
			device.writeServiceCharacteristic(    
			   '0000fff0-0000-1000-8000-00805f9b34fb', 
			    '0000fff4-0000-1000-8000-00805f9b34fb',      
			     new Uint8Array([161,178,195,212]), // Write password   
			     // new Uint8Array([161,164,36,164]), // Write password   
			    function()
			    {    
				  app.iPickView.hidePreloader();
			      console.log('BLE password written.');  
			    },      
			    function(errorCode)     
			    {
			      //alert('BLE writeServiceCharacteristic pass error: ' + errorCode);
			    });
		},
		readPairingMode:function(device){
			
			device.readServiceCharacteristic(
			    '0000fff0-0000-1000-8000-00805f9b34fb',
			    '0000fff5-0000-1000-8000-00805f9b34fb',
			    function(data)
			    {
			     
			      var paringMode = new Uint8Array(data)[0];
			      if (paringMode == 1){     
			    	  
			    	   app.stopStop();
			    	   clearInterval(app.intervalTemporizzatore);
			    	   app.chooseOptionsNewDevice(device);        
			    	     
			      }else{             
			    	  device.close();  
			    	  //app.stopStop();               
			      }
			                   
			    },      
			    function(errorCode)
			    {  
			      console.log('Pairing mode value error: ' + errorCode);  
			    });
		},
		
		chooseOptionsNewDevice: function(device){
			//$.mobile.changePage("#optionNewDevice",{transition: "slide",  allowSamePageTransition: true,reloadPage: false });  
			app.stopStop();
			app.viewMain.router.load({   
			    url: 'newDeviceOption.html',
			    animatePages: true      
			});  
			
			app.iPickView.onPageInit('newDeviceOption', function (page) {
				   
				app.viewMain.showNavbar();
				app.newDeviceFoto='';
				$$('#btn_photoid').on('click', function () {  
					  app.iPickView.pickerModal('.picker-info');
					});
				
				$$('#cancelPicker_btn').on('click', function () {
					app.iPickView.closeModal('.picker-info');
				}); 
				
				
				$$("#takephoto_btn").on('click',function(){
				   app.iPickView.closeModal('.picker-info');
				   app.openCamera('camera-thmb','largeImage',device,app.setFotoNewDevice,'camera');	  
				 
				});
				
				
				$$('#bnt_iconId_newDevice').on('click', function () {
					  // Check first, if we already have opened picker
					  if ($$('.picker-modal.modal-in').length > 0) {
						  app.iPickView.closeModal('.picker-modal.modal-in');
					  }
					  
					  var html = '';
					  html+='<div height="100" class="picker-modal">' +
				      '<div class="toolbar">' +
				        '<div class="toolbar-inner">' +
				          '<div class="left"></div>' +
				          '<div class="right"><a href="#" class="close-picker">Close</a></div>' +
				        '</div>' +
				      '</div>' +
				      '<div class="picker-modal-inner">'+
				      '<div class="content-block">';
					  html+=  '<div class="row" >';
					  
					  for (var i=1;i<=60;i++){
						  html+= '<div class="col-33 icon_'+i+'"><img width="70" height="40" src="icons/'+i+'.png"></div>';
						  if (i%3 == 0){
							  html+=  '</div>';
							  html+=  '<div class="row">';
						  }
						  
					  }
					  html+=  '</div></div></div></div>';
					  app.iPickView.pickerModal(html);
					  
					  
						$$(".col-33").on('click',function(){
						  var txtClass = $$(this).attr("class").split(" ")[1];
						  
						  var iconChoose = txtClass.split("_")[1];
						  app.iPickView.closeModal('.picker-modal.modal-in');
						  
						  var url = 'icons/'+iconChoose+'.png';
						//  var url = 'icons/'+'gigio'+'.png';
						  
							app.toDataUrl(url, function(base64Img) {
								app.setFotoNewDevice(base64Img.split(",")[1]);
								document.getElementById('largeImage').src = url;   
							});
						  
						});
					});
				
				
				
				$$("#photoLibrary_btn").on('click',function(){
					   app.iPickView.closeModal('.picker-info');
					   app.openCamera('camera-thmb','largeImage',device,app.setFotoNewDevice,'library');	  
				});
				
				$$("#saveNewDevice").on('click',function(){
					//if($$("#namePick_id").val() && app.newDeviceFoto){
						if (!$$("#namePick_id").val()){
							app.iPickView.alert("Name's pick is mandatory","Error");
	                		return;
						}
						
						if (!app.newDeviceFoto){
							app.iPickView.alert("Image or Icon is Mandatory","Error");
							return;
						}
						
						app.saveNewDevice(device, $$("#namePick_id").val(), app.newDeviceFoto);
						            
				});  
		    });  
		},     
		
		getCurrentPosition: function(init){
			if (init){
				navigator.geolocation.getCurrentPosition(
						 function(position){
								app.currentPosition =  {	 
									    'Lat': position.coords.latitude,
									    'Long': position.coords.longitude
								      };
						 }, app.onMapError,{enableHighAccuracy: true});
			}
			else{
				navigator.geolocation.getCurrentPosition(
						  app.onMapSuccess, app.onMapError,{enableHighAccuracy: true});
			}
		},
	    onMapSuccess:function (position) {
		    	app.currentPosition =  {	 
			    'Lat': position.coords.latitude,
			    'Long': position.coords.longitude
		       };
		    
		    if (!app.map){
		    	
	    	  app.map = new google.maps.Map(document.getElementById('mapDiv'), {  
		          zoom: 15
				});
	    	  
		    	  app.map.setCenter({    
	   	        	  lat:app.currentPosition.Lat,
	   	        	  lng:app.currentPosition.Long
	   	          });
		    	  
		    	  app.addYourLocationButton(position);
		    	/*  var geolocationDiv = document.createElement('div');
		    	  var geolocationControl = new app.GeolocationControl(geolocationDiv, app.map,position);
		    	  app.map.controls[google.maps.ControlPosition.TOP_CENTER].push(geolocationDiv);*/
		    }
				app.setMarkerDevices();
	    	
		},
		addYourLocationButton:function(position) 
		{
		    var controlDiv = document.createElement('div');
		    var firstChild = document.createElement('button');
		    firstChild.style.backgroundColor = '#fff';
		    firstChild.style.border = 'none';
		    firstChild.style.outline = 'none';
		    firstChild.style.width = '28px';
		    firstChild.style.height = '28px';
		    firstChild.style.borderRadius = '2px';
		    firstChild.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
		    firstChild.style.cursor = 'pointer';
		    firstChild.style.marginRight = '10px';
		    firstChild.style.padding = '0';
		    firstChild.title = 'Your Location';
		    controlDiv.appendChild(firstChild);

		    var secondChild = document.createElement('div');
		    secondChild.style.margin = '5px';
		    secondChild.style.width = '18px';
		    secondChild.style.height = '18px';
		    secondChild.style.backgroundImage = 'url(https://maps.gstatic.com/tactile/mylocation/mylocation-sprite-2x.png)';
		    secondChild.style.backgroundSize = '180px 18px';
		    secondChild.style.backgroundPosition = '0 0';
		    secondChild.style.backgroundRepeat = 'no-repeat';
		    firstChild.appendChild(secondChild);

		    google.maps.event.addListener(app.map, 'center_changed', function () {
		        secondChild.style['background-position'] = '0 0';
		    });
		    firstChild.addEventListener('click', function () {
		        var imgX = '0',
		            animationInterval = setInterval(function () {
		                imgX = imgX === '-18' ? '0' : '-18';
		                secondChild.style['background-position'] = imgX+'px 0';
		            }, 500);

		        //if(navigator.geolocation) {
		         //   navigator.geolocation.getCurrentPosition(function(position) {
		                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		                app.map.setCenter(latlng);
		                clearInterval(animationInterval);
		                secondChild.style['background-position'] = '-144px 0';
		           // });
		        /*} else {
		            clearInterval(animationInterval);
		            secondChild.style['background-position'] = '0 0';
		        }*/
		    });

		    controlDiv.index = 1;
		    app.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv);
		},
	    GeolocationControl:function(controlDiv, map,position) {

		    // Set CSS for the control button
		    var controlUI = document.createElement('div');
		    controlUI.style.backgroundColor = '#444';
		    controlUI.style.borderStyle = 'solid';
		    controlUI.style.borderWidth = '1px';
		    controlUI.style.borderColor = 'white';
		    controlUI.style.height = '28px';
		    controlUI.style.marginTop = '5px';
		    controlUI.style.cursor = 'pointer';
		    controlUI.style.textAlign = 'center';
		    controlUI.title = 'Click to center map on your location';
		    controlDiv.appendChild(controlUI);

		    // Set CSS for the control text
		    var controlText = document.createElement('div');
		    controlText.style.fontFamily = 'Arial,sans-serif';
		    controlText.style.fontSize = '10px';
		    controlText.style.color = 'white';
		    controlText.style.paddingLeft = '10px';
		    controlText.style.paddingRight = '10px';
		    controlText.style.marginTop = '8px';
		    controlText.innerHTML = 'Your location';
		    controlUI.appendChild(controlText);
		    // Setup the click event listeners to geolocate user
		    google.maps.event.addDomListener(controlUI, 'click', function(){
		    	app.geolocate(position);
		    });
		},
		 geolocate:function(position) {

		 //   if (navigator.geolocation) {

		  //      navigator.geolocation.getCurrentPosition(function (position) {

		            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

		            // Create a marker and center map on user location
		            marker = new google.maps.Marker({
		                position: pos,
		                draggable: true,
		                animation: google.maps.Animation.DROP,
		                map: app.map
		            });
		            app.map.setCenter(pos);
		    //    });
		   // }
		},
		onMapError:function(){
			app.iPickView.alert("Please Active GPS to see the map","Error");
		},
		saveNewDevice:function(device,nameDevice,imageDevice){
		  app.setMyDevice(device.address,nameDevice,imageDevice);
		 // app.initialize();
		
		},
		updateDevice:function(id,name,image,safetymode){
			var idDevice = id*1;    
			if (safetymode==true){
				safetymode = "checked";
			}
			else{
				safetymode = '';
			}
		    app.db.transaction(function(tx){
				  tx.executeSql('update devices set name = ? ,image = ? ,safetymode = ? where id = ?', [name,image,safetymode,idDevice],   
					 function(tx, results){    
					  for (var i in app.devices){
                          app.devices[i].close();
                     }
					  window.location='index.html';        
					}, app.errorCB);
		    });    
		},   
		updateList: function(id,name,color, nameimagelist){
			var idList = id*1;
			app.db.transaction(function(tx){
				  tx.executeSql('update lists set name = ? ,image = ? ,color = ? , nameimagelist = ? where id = ?', [name,app.updateListFoto,color,nameimagelist,idList],   
					 function(tx, results){   
					  for (var i in app.devices){
                          app.devices[i].close();
                      }
					  window.location='index.html'; 
					}, app.errorCB);
		    });    
		},
		saveNewList:function(nameList,color,iconChoose){
			app.setMyList(nameList,color,iconChoose);
		},
		saveUpdateList:function(idList,nameList,color,nameimagelist){
			app.updateList(idList,nameList,color,nameimagelist);
		},
		logClick:function(device,fromConnection){
			device.enableServiceNotification(
			  '0000ffe0-0000-1000-8000-00805f9b34fb',
			  '0000ffe1-0000-1000-8000-00805f9b34fb',
			  function(data)  
			  {  
			    var res = new Uint8Array(data)[0];
			    if (res == 8){
			    	var address =device.address;
			    	if (app.devicesRing[address]){
			    		app.onToggleButton(address);
			    	}
			    }    
			    
			    if (res == 2 && !fromConnection){
			    	
			    	if (app.atBackground){
			    		 cordova.plugins.notification.local.schedule({
				    			id: app.idNotification,  
				    			sound:'ringa.mp3',
				    			title: 'Pik Call' });           
						 app.idNotification++; 
			    	}
			    	 app.ringCell();
			    }
			    fromConnection = false;
			  },   
			  function(errorCode)
			  {
			    console.log('BLE enableServiceNotification error: ' + errorCode);
			  });
		},

		readServices:function(device,newDev)
		{
			/**
			 * diretto fa prima
			 * se è nuovo leggo il servizio del pairing mode, altrimenti quello dello writepassword
			 */
			
			var serviceUID = null;
			if (app.deviceType=='iPhone' || app.deviceType=='iPad'){
				//serviceUID = new Array('0000180f-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','00001802-0000-1000-8000-00805f9b34fb','00001803-0000-1000-8000-00805f9b34fb');
			}
			// Read all services.
			device.readServices(  
			     serviceUID,     
				function(device)  
				{         
					if (newDev==true){
						app.readPairingMode(device);
					}
					else{   
						device.alerted = false;  
						device.connected = 'connected';  
					    app.updateConnectionDeviceFound(device);
						app.devices[device.address] = device;
						app.readBattery(device);
						app.writePasswordiTrak(device);     
					    //abilito il click sul pulsante
						app.logClick(device,true);	
					}
				},
				function(error)  
				{
					alert('Error: Failed to read services: ' + JSON.stringify(error));
				});
		},
	    onToggleButton: function(address)
		{
			var device = app.devices[address];  
			if (app.devicesRing[address]){
				app.devicesRing[address] = 0;
				var led = new Uint8Array([0]);          
			}else{      
				app.devicesRing[address] = 1;  
				var led = new Uint8Array([2]);    
			}
			
			device.writeServiceCharacteristic(
				    '00001802-0000-1000-8000-00805f9b34fb',
				    '00002a06-0000-1000-8000-00805f9b34fb',    
				    led,                         
				    function()   
				    {    
				       return;
				    },  
				    function(errorCode)  
				    {
				      console.log(errorCode);
				    });  
		   
		},
		showInfo:function(t){
			console.log(t);
		}
			   
};  
document.addEventListener('deviceready', function(){
	app.deviceType = (navigator.userAgent.match(/iPad/i))  == "iPad" ? "iPad" : (navigator.userAgent.match(/iPhone/i))  == "iPhone" ? "iPhone" : (navigator.userAgent.match(/Android/i)) == "Android" ? "Android" : (navigator.userAgent.match(/BlackBerry/i)) == "BlackBerry" ? "BlackBerry" : "null";
	if (app.deviceType=='iPhone' || app.deviceType=='iPad'){
          app.os = 'ios';		
	}
	else{
		app.os = 'android';
	}
	var path = window.location.pathname;
	if (app.os=='android'){
		app.directory = 'file://' + path.substr( 0, path.length - 10 );
	}
	else{
		app.directory = path.substr( 0, path.length - 10 );
	}
	app.initialize();       
}, false);  

document.addEventListener('pause', function(){
	app.atBackground = true;
}, false);   
  

document.addEventListener('resume', function(){ 
	app.atBackground = false;  
	clearInterval(app.intervalPause);   
	
}, false); 
   
        
 
