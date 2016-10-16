

var $$ = Dom7;

var i=false;
     
  
  
var app = {
		timeStartScanNewDev:'',
		iPickView:{},
		db:{},
		viewMain:{},
		listView:{},
		mapView:{},
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
		deviceSelected:{},  
		deviceInList:[],
		pictureSource: '' ,  
		map:null,
		numberReloadListPage:0,
	    destinationType:'' ,
	    currentPosition: null,
	    t:0,
	    mapJustResized:0,
		deviceJustConnected:new Array(),  
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
			  tx.executeSql('SELECT id, name, address , connected ,long, lat, image FROM devices', [], 
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
						   }
						   callback(callback2);    
						  
				}, app.errorCB);
		  }, app.errorCB);    
		},
		
		getMyLists: function(callback){
			  app.db.transaction(function(tx){
				  tx.executeSql('SELECT id, name,image,color FROM lists', [], 
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
			var obj = {
					id:myDev.length + 1,
					address:deviceAddress,  
					name:name,
					image:image,
					list: [],
					connected:'notconnected',
					last_seen:Date.now()
				
			};
			
			myDev.push(obj); 
			app.myDevices = myDev;
			
		    this.db.transaction(function(tx){
				  tx.executeSql('insert into devices (id,address,name,image,connected, last_seen) values (?,?,?,?,?,?)', [obj.id,obj.address,obj.name,obj.image ,obj.connected,obj.last_seen], 
					 function(tx, results){  
					}, app.errorCB);
		    });  
		},    
		deleteAllFromDb:function(){
			  this.db.transaction(function(tx){
				  tx.executeSql('delete from devices', [],   
					 function(tx, results){
							console.log("eliminato tutto");  
					}, app.errorCB)
			  }, app.errorCB);   
		},
		setMyList:function(nameList,color){
			var myLists = app.myLists;
			if ($.isEmptyObject(myLists)){
				myLists = new Array();
			}   
			var obj = {
					name:nameList,
					color:color,
					image:app.newListFoto,
					id:myLists.length + 1,
			}
			myLists.push(obj);  
			app.myLists = myLists;
			 this.db.transaction(function(tx){
				  tx.executeSql('insert into lists (id,name,image,color) values (?,?,?,?)', [obj.id,obj.name,obj.image,obj.color], 
					 function(tx, results){   
					}, app.errorCB);
			  }, app.errorCB);    
		},
		loadFrameworkAndHome:function(){
			  app.iPickView = new Framework7({  
					template7Pages: true,      
					precompileTemplates: true,   
					allowDuplicateUrls:true,
					onAjaxStart:function(){
						//myApp.showPreloader();
					},    
					onAjaxComplete:function(){
						//myApp.hidePreloader();    
					},  
					template7Data : {
						'devices' : {'devices':app.myDevices,'lists':app.myLists,'deviceinlist':app.deviceInList}
					},
					onPageAfterBack:function(application, page){  
						switch (page.name){
						   case 'about':
						   {  
							   var dev = app.devices[page.query.address];
							   if (!$.isEmptyObject(dev)){
								   dev.close();  
							   }
							   app.scanHome();             
						   }    
						   break;
						   case 'newDevice':{
								$$("#toolbar_id").show();     
						   }
						   break;
						   case 'listDetailPage':{
						   
							   app.numberReloadListPage = 0;
						
						    }
						}
						   
					}
					 

				});
			  
				  app.listView = app.iPickView.addView('.view-list',{});  
				  app.viewMain = app.iPickView.addView('.view-main', {});
				  app.mapView  = app.iPickView.addView('.view-map',{});
				  
				  
				 if (!app.myDevices.length){       
						//app.showMyDevice();      
					 app.disconnectToDevice();         
					 app.addNewDevice();     
						return;  
				  }    
				  app.loadHome();   
				  app.devicesRing = new Array();
				  app.newDeviceFoto = {};
				  app.loadLists();
				  app.loadMap();
				  app.initMap();
				  app.pageInitHome();
				  app.pageInitAbout();   
		},
		initialize:function(){      
			   // this.deleteAllDevice();    
			    cordova.plugins.locationManager.requestAlwaysAuthorization();
			    var delegate = new cordova.plugins.locationManager.Delegate();
			    cordova.plugins.locationManager.setDelegate(delegate);
			    this.devices = [];    
				this.pictureSource = navigator.camera.PictureSourceType,
			    this.destinationType = navigator.camera.DestinationType,  
				this.db =  window.openDatabase("DatabasePick", "1.0", "Pick", 200000);
				this.db.transaction(this.populateDB, this.errorCB);
				//this.db.transaction(this.dropTables, this.errorCB);
				//return;  
				this.getMyDevice(this.getMyLists,this.loadFrameworkAndHome);     
			  
		},    
		successCB:function(){  
			 app.db.transaction(app.queryDB, app.errorCB);    
		},      
		queryDB:function(tx){  
			  tx.executeSql('SELECT * FROM devices', [], app.querySuccess, app.errorCB);
		},
		querySuccess:function(tx, results){
			console.log(JSON.stringify(results.rows.item));  
		
		},
		errorCB:function(err) {
	        console.log("Error processing SQL: "+JSON.stringify(err));
	    },
		populateDB:function(tx){  
			 tx.executeSql('CREATE TABLE IF NOT EXISTS DEVICES (id unique,address,name,image,connected, long,lat, last_seen)');
			 tx.executeSql('CREATE TABLE IF NOT EXISTS LISTS (id unique,name,image,color)');
	         tx.executeSql('CREATE TABLE IF NOT EXISTS DEVICEINLIST (idlist,iddevice)');    
		},    
		dropTables:function(tx){
			tx.executeSql('DROP TABLE  DEVICES ');
			 tx.executeSql('DROP TABLE LISTS');
	         tx.executeSql('DROP TABLE  DEVICEINLIST ');    
		},
		pageInitHome:function(){
			
			  app.iPickView.onPageInit('home', function (page) {
				  app.viewMain.params.dynamicNavbar = true;
				  $$("#add_deviceId").on('click',function(){  
					 app.addNewDevice();  
				  });   
				 
				             
			  });        
		},
		pageInitAbout:function(){
			  
			 app.iPickView.onPageInit('about', function (page) {
				 app.iPickView.showPreloader();
				 app.viewMain.params.dynamicNavbar = true;
				 clearInterval(app.intervalHome);
				 var addressItrackSelected = page.query.address;
				 app.connectToDevice(addressItrackSelected);
				 $$("#bell_ring").on('click',function(){
					 app.onToggleButton(addressItrackSelected);  
				 });
			  });
		},   
		pageInitList:function(){   
			 app.iPickView.onPageInit('listPage', function (page) {
				
				 $$("#listTab").on('click',function(){
					 $$('.listLi > i').removeClass('fa-check-square-all-conn');
					 $$('.listLi > i').addClass('fa-check-square-not-all-conn');
				 });
				 
				 
				 app.listView.params.dynamicNavbar = true;

				 $$("#add_listId").on('click',function(){
					  app.addNewList();   
				      $$("#add_listId").hide();    
				  });   
				  
				    
					$$('.listLi').on('click',function(e){
						 var listToCheck = $$(this).prop('id')*1;
						  //salvo temporaneamente l'href perchè altrimenti mi butta nel dettaglio
						  var listLi = $$(this);
						  var aParents = $$(this).parents( "a" );
						  var href = aParents.attr("href");
						  $$(this).parents( "a" ).removeAttr("href");
						  app.db.transaction(function(tx){   
							  tx.executeSql('SELECT d.id, d.name FROM devices d inner join deviceinlist t on d.id = t.iddevice where t.idlist = ? ', [listToCheck], 
								 function(tx, results){
								   var resultQuery = new Array();
								   var len=results.rows.length;  
								   var deviceDisconnected = '';
								   for (var i=0;i<len;i++){  
									   if (!app.checkDeviceIfConnectedById(results.rows.item(i).id)){
										   deviceDisconnected+= results.rows.item(i).name + ' ';	   
									   }
								   }
								   
								   if (deviceDisconnected){ 
									   alert("Sono disconnessi: "+deviceDisconnected);  
									   listLi.children('i').addClass('fa-check-square-not-all-conn');
									   listLi.children('i').removeClass('fa-check-square-all-conn');
								   }  
								   else{
									   listLi.children('i').removeClass('fa-check-square-not-all-conn');
									   listLi.children('i').addClass('fa-check-square-all-conn');
								   }   
								   aParents.attr('href', href);   
								}, app.errorCB);          
						  }, app.errorCB);   
						 
					});   
				  
			  });
		},  
		pageInitListDetail:function(){
			 app.iPickView.onPageInit('listDetailPage', function (page) {
				 
				 app.iPickView.showPreloader();
				 //svuoto contenuto
				 app.listView.params.dynamicNavbar = true;
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
						    	app.reloadListDetail(page.query.title,page.query.id,true);
						    }, app.errorCB);  
					  }, app.errorCB);   
				});    
				
				if (!app.numberReloadListPage){
				  app.db.transaction(function(tx){   
					  tx.executeSql('SELECT d.id,d.address,d.image,d.name FROM devices d inner join deviceinlist t on d.id = t.iddevice where t.idlist = ? ', [idList], 
					 // tx.executeSql('SELECT d.id,d.address FROM devices d', [], 
						 function(tx, results){
						   app.deviceInList = new Array();
						   var resultQuery = new Array();
						   var len=results.rows.length;  
						   for (var i=0;i<len;i++){
							   resultQuery.push(results.rows.item(i));
						   }  
						   app.deviceInList = JSON.parse(JSON.stringify(resultQuery));
						   app.iPickView.template7Data.devices.deviceinlist = app.deviceInList;
				           app.reloadListDetail(page.query.title,page.query.id);  
						}, app.errorCB);          
				  }, app.errorCB);        
				}else{
					app.iPickView.hidePreloader();  
				}       
				
		   });        
			  
  			   	    
		},
		reloadListDetail:function(title,id,fromNewDeviceInList){
			  setTimeout(function(){
				  if (!fromNewDeviceInList){
					  app.numberReloadListPage = 1;
				  }
				  app.listView.router.load({  
					    url: 'listDetail.html?title='+title+'&id='+id,  
					    animatePages: false,
					    contextName:'devices', 
					    reload:true   
					}); 
				  
				  $$("#toolbar_id").show();      
				  app.iPickView.hidePreloader();
			  },500);  
						  
		},
		loadLists:function(){
			if ($.isEmptyObject(app.myLists)){     
					//app.showMyDevice();            
					this.addNewList();   
					 $$("#add_listId").hide();    
					return;  
			}else{    
				this.listView.router.load({
				    url: 'list.html',
				    animatePages: false,
				    contextName:'devices'       
				 
				});
				this.pageInitList();
				this.pageInitListDetail();    
			}  
			     
		},    
		loadMap:function(){
			this.mapView.router.load({
			    url: 'map.html',
			    animatePages: false
			});  
		},
		initMap:function(){     
			app.iPickView.onPageInit('mapPage', function (page) {
				 app.mapView.params.dynamicNavbar = true;
				 
				 $$("#mapTab").on('click',function(){
				    app.renderMap();
				 });   
				
			  });  
			
		},
		renderMap:function(){
			if (!app.map){
				if (!app.currentPosition){
					app.getCurrentPosition();
				}else{
					
					  app.map = new google.maps.Map(document.getElementById('mapDiv'), {  
			          zoom: 11,
			          center: {
			        	  lat:app.currentPosition.Lat,
			        	  lng:app.currentPosition.Long
			          }
					});
					  
					  google.maps.event.trigger(app.map, 'resize');
				
				}
				
			}else{
				if (!app.mapJustResized){
					app.mapJustResized = 1;  
					google.maps.event.trigger(app.map, 'resize');
				}
			}
			 
		},
	    loadHome:function(){
			this.viewMain.router.load({
			    url: 'home.html',
			    contextName:'devices',   
			    animatePages: false
			});  
			this.scanHome();
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
				  app.updateConnectionDeviceNotFound();
			  },4000);  
			 
			  
			  app.intervalPosition = setInterval(function(){
				  app.getCurrentPosition();
			  },15000);       
		},      
		  
		stopStop:function(){
			app.updateConnectionDeviceNotFound();
			evothings.easyble.stopScan();  
			this.disconnectToDevice();  
		},       
		    
		addNewDevice:function (){
			 //$.mobile.changePage("#newDevice",{transition: "slide",  allowSamePageTransition: true,reloadPage: false }); 
			clearInterval(app.intervalHome);
		 	this.viewMain.router.load({
			    url: 'newDevice.html',  
			    animatePages: true      
			});    
			$$("#toolbar_id").hide();    
			   
			this.iPickView.onPageInit('newDevice', function (page) {
				    
				//$$("#navigationNewDevice").append($$("#navBarListSimple").html())
			}); 
			           
			//this.stopStop();  
		    //this.startScan(true);     
			setTimeout(function(){
				app.stopStop();
 				app.startScan(true); 
				//$$("#toolbar_id").show();   
				//app.viewMain.showNavbar();  
			 }, 3000);      
		},
		
		addNewList: function(){
			this.listView.router.load({
			    url: 'newList.html',
			    animatePages: true      
			});  
			//$$("#toolbar_id").hide();   

			 app.iPickView.onPageInit('newList', function (page) {
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
						         '<div  class="col-auto redColor">&nbsp;</div>'+
						        '<div class="col-auto yellowColor">&nbsp;</div>'+
						        '<div  class="col-auto greenColor">&nbsp;</div>'+
						        '</div>' +
						        ' <div class="row">'+
						         '<div class="col-auto greyColor">&nbsp;</div>'+
						        '<div class="col-auto  lblueColor">&nbsp;</div>'+
						        '<div class="col-auto  orangeColor">&nbsp;</div>'+
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
								   $$('.create-picker').css('background','red');
								   colorChoosen = 'red';
							   }  
							   break;
							   case 'yellowColor':{
								   $$('.create-picker').css('background','yellow');
								   colorChoosen = 'yellow';
							   }
							   break;
							   case 'greenColor':{
								   $$('.create-picker').css('background','green');
								   colorChoosen = 'green';
							   }
							   break;
							     
							   }
							   
							});
						}); 
					
					$$('#btn_photoListid').on('click', function () {
						  app.iPickView.pickerModal('.picker-info-list');
				    });
					
					
					$$("#takephotoList_btn").on('click',function(){
					   app.iPickView.closeModal('.picker-info-list');
					   app.openCamera('camera-thmb','largeImageList','',app.setFotoNewList);	  
					});
					
					$$("#saveNewList").on('click',function(){
						app.saveNewList($$("#List_id").val(),colorChoosen);
						window.location='index.html';              
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
		openCamera:function(selection,div,device,callback) {

		    var srcType = Camera.PictureSourceType.CAMERA;
		    var options = app.setOptionsCamera(srcType);

		    if (selection == "camera-thmb") {
		        //options.targetHeight = 100;
		        //options.targetWidth = 100;
		    }
		        

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
		isMyDevice:function(address){
           for (var t in app.myDevices){
        	   if (app.myDevices[t].address == address){
        		   return true;
        	   }
           }	
           return false;
		},
		updateConnectionDeviceFound:function(device){
			 for (var i=0;i<app.myDevices.length;i++){
				 if (app.myDevices[i].address == device.address){
					 if (!app.myDevices[i].lastUpdate || (app.myDevices[i].lastUpdate  && (Date.now() - app.myDevices[i].lastUpdate) > 4000)){
				     app.myDevices[i].lastUpdate = Date.now();
					 app.myDevices[i].connected = 'connected';
					 if (app.currentPosition){
						 app.myDevices[i].lat = app.currentPosition.Lat;
						 app.myDevices[i].long = app.currentPosition.Long;
						 app.db.transaction(function(tx){
						  tx.executeSql('update devices set lat = ? , long = ? , last_seen = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,device.lastSeen,app.myDevices[i].id], 
							 function(tx, results){  
							}, app.errorCB);
						   }); 
					 }
			    }   
					break;
		     }          
		  }  
	     
		},   
		updateConnectionDeviceNotFound:function(){ 
			var timeConnectionToCheck;
			if (app.atBackground){       
				timeConnectionToCheck = 15000;
			}else{  
				timeConnectionToCheck = 7000;   
			}  
			 for (var dev in app.myDevices){
				 var device = app.myDevices[dev].address;  
				 if (typeof(app.devices[device])!='undefined' && app.devices[device].lastSeen &&  ( Date.now() - app.devices[device].lastSeen > timeConnectionToCheck && !app.devices[device].alerted)){
					 app.devices[device].alerted = true;
					 if (app.atBackground){       
						 cordova.plugins.notification.local.schedule({
				    			id: app.idNotification,
				    			title: app.myDevices[dev].name });
						 app.idNotification++;
					 }else{  
						 app.myDevices[dev].connected = 'notconnected';  
					 }   
					   
				 } 
			 } 
		},  
		checkDeviceIfConnectedById: function(id){
			for (var dev in app.myDevices){
				if (id == app.myDevices[dev].id){
					if (app.myDevices[dev].connected == 'connected'){
						return true;
					}
				}  
			 } 
			return false;
		},     
		startScan: function(newDev)  
		{ 
		 
			if (newDev){
			  app.timeStartScanNewDev = new Date().getTime();
			}
			//evothings.ble.startScan(   
			evothings.easyble.startScan(     
				function(device){    
					if (device.hasName('iTrack')){
						device.lastSeen = Date.now();
						device.alerted = false;
						app.devices[device.address] = device;   
						if (newDev==true && !app.isMyDevice(device.address)){ 
							app.connectToDevice(device.address,newDev);     
						}else{      
							if (!newDev){
							 app.updateConnectionDeviceFound(device);
							}
						}    
				    }    
				},
				function(error)      
				{     
					
				},
				 { serviceUUIDs: ['0000fff0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','00001802-0000-1000-8000-00805f9b34fb'] }
			    );
		
		},
		disconnectToDevice:function(){
			evothings.easyble.closeConnectedDevices();
		},
		/**
		 * Read services for a device.
		 */
		connectToDevice:function(deviceAddress,newDev)      
		{
			app.showInfo('Status: Connecting device:'+ deviceAddress );
			
			var device  = app.devices[deviceAddress];   
			if (!$.isEmptyObject(device)){
				//evothings.easyble.stopScan();
			 //if (app.DeviceConnected[deviceAddress] == null ){            
				device.connect(   
					function(device)   
					{       
						app.showInfo('Status: Connected');
					    app.readServices(device,newDev);
				
					},  
					function(errorCode)   
					{
						//app.deviceJustConnected.push(deviceAddress);
						app.showInfo('Error: Connection failed: ' + errorCode + ' and deviceAddress: '+deviceAddress); 
						device.close();   
						//app.connectToDevice(deviceAddress);
						     
					});
				
			}
			else{
				app.connectToDevice(deviceAddress);  
				//app.iPickView.hidePreloader(); 
			}
				
		      // }  
			
		},  
		readBattery: function(device){
			device.readServiceCharacteristic(    
					   '0000180f-0000-1000-8000-00805f9b34fb', 
					   '00002a19-0000-1000-8000-00805f9b34fb',
					    function(data)
					    {
					      var batteryLevel = new Uint8Array(data)[0];
					      console.log(JSON.stringify(new Uint8Array(data)));
					       console.log("batteryLevel: " + batteryLevel);
						 },                  
					    function(errorCode)     
					    {
					      alert('BLE writeServiceCharacteristic pass error: ' + errorCode);
					    });
		},
		writePasswordiTrak: function (device){   
			device.writeServiceCharacteristic(    
			   '0000fff0-0000-1000-8000-00805f9b34fb', 
			    '0000fff4-0000-1000-8000-00805f9b34fb',      
			     new Uint8Array([161,164,36,164]), // Write password   
			    function()
			    {    
				  app.iPickView.hidePreloader();
			      console.log('BLE password written.');  
			    },      
			    function(errorCode)     
			    {
			      alert('BLE writeServiceCharacteristic pass error: ' + errorCode);
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
			this.stopStop();
			this.viewMain.router.load({   
			    url: 'newDeviceOption.html',
			    animatePages: true      
			});  
			
			app.iPickView.onPageInit('newDeviceOption', function (page) {
				
				$$('#btn_photoid').on('click', function () {
					  app.iPickView.pickerModal('.picker-info');
					});
				
				$$('#cancelPicker_btn').on('click', function () {
					app.iPickView.closeModal('.picker-info');
				}); 
				
				
				$$("#takephoto_btn").on('click',function(){
				   app.iPickView.closeModal('.picker-info');
				   app.openCamera('camera-thmb','largeImage',device,app.setFotoNewDevice);	  
				
				});
				
				$$("#saveNewDevice").on('click',function(){
					//if($$("#namePick_id").val() && app.newDeviceFoto){
						app.saveNewDevice(device, $$("#namePick_id").val(), app.newDeviceFoto);
						window.location='index.html';              
				});  
		    });  
		},
		
		getCurrentPosition: function(){
			navigator.geolocation.getCurrentPosition(
			  app.onMapSuccess, app.onMapError,{enableHighAccuracy: true});
		},
	    onMapSuccess:function (position) {
	    	app.currentPosition =  {	 
		    'Lat': position.coords.latitude,
		    'Long': position.coords.longitude
	       };
	    	
	       app.renderMap();
		},
		onMapError:function(){
			return '';
		},
		saveNewDevice:function(device,nameDevice,imageDevice){
		  app.setMyDevice(device.address,nameDevice,imageDevice);
		 // app.initialize();
		
		},
		saveNewList:function(nameList,color){
			app.setMyList(nameList,color);
		},
		logClick:function(device){
			console.log("log click");
			device.enableServiceNotification(
			  '0000ffe0-0000-1000-8000-00805f9b34fb',
			  '0000ffe1-0000-1000-8000-00805f9b34fb',
			  function(data)
			  {  
			    var res = new Uint8Array(data)[0];
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
			//if (newDev == true){
				var serviceUID = [ '0000180f-0000-1000-8000-00805f9b34fb','0000fff0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','00001802-0000-1000-8000-00805f9b34fb'];
			/*}     
			else{
				var serviceUID = [' '0000fff0-0000-1000-8000-00805f9b34fb''];
			}*/
			// Read all services.
			device.readServices(  
			    serviceUID,     
				function(device)   
				{   
					if (newDev==true){
						app.readPairingMode(device);
					}
					else{     
						app.readBattery(device);
						app.writePasswordiTrak(device);  
						//abilito il click sul pulsante
			            app.logClick(device);		
					}
				},
				function(error)  
				{
					console.log('Error: Failed to read services: ' + error);
				});
		},
	    onToggleButton: function(address)
		{
			var device = app.devices[address];      
			console.log("Suona");      
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
	app.initialize();       
}, false);  

document.addEventListener('pause', function(){
	app.atBackground = true;
}, false);   
  

document.addEventListener('resume', function(){
	app.atBackground = false;  
	clearInterval(app.intervalPause);   
	
}, false); 
   
        
 