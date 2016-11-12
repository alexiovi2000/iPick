

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
		intervalConnectionDevice:'',
		atBackground:'',
		newDeviceFoto:{},     
		newListFoto:{},
		updateDeviceFoto:{},
		deviceSelected:{},  
		deviceInList:[],
		pictureSource: '' ,  
		map:null,
		numberReloadListPage:0,
	    destinationType:'' ,
	    currentPosition: null,
	    t:0,
	    markers:new Array(),
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
						'devices' : {'devices':app.myDevices,'lists':app.myLists,'deviceinlist':app.deviceInList}
					},
				   preroute: function (view, options) {
					        if (!localStorage.getItem('tokenPick')) {
					            app.viewMain.router.loadPage('registration.html'); //load another page with auth form
					            return false; //required to prevent default router action
					        }   
					},
					onPageAfterBack:function(application, page){  
						switch (page.name){
						   case 'about':
						   {     
							   clearInterval(app.intervalAbout);
							   /*var dev = app.devices[page.query.address];
							 
							   if (!$.isEmptyObject(dev)){    
								   dev.close();  
							   }*/
							   app.scanHome();  
						   }    
						   break;
						   case 'newDevice':{
								$$("#toolbar_id").show();    
								clearInterval(app.intervalTemporizzatore);
								app.stopStop();
								app.scanHome();    
								app.setIntervalConnectDevice();
						   }
						   break;
						   case 'listDetailPage':{
						   console.log("qua");
							   app.numberReloadListPage = 0;
							   setTimeout(function(){
								   app.listView.router.load({
									    url: 'list.html',
									    animatePages: false,
									    contextName:'devices',
									    reload:true
									});
								   $$("#logoPickList").prop("src",app.logoInBase64);
							   },2000);    
						    }
						   break;
						   case 'newDeviceOption':{
							   
							   clearInterval(app.intervalTemporizzatore); 
							   
						   }
						   break;
					 
						}
						   
					}
					 

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
					 
					 return;
				    }
				
					 if (!app.myDevices.length){       
							//app.showMyDevice();      
						 app.disconnectToDevice();         
						 app.addNewDevice();     
							return;  
			 		  }    
					  app.loadHome();   
					  app.setIntervalConnectDevice();
					  app.devicesRing = new Array();
					  app.newDeviceFoto = {};
					  app.loadLists();
					  app.loadMap();
					  app.initMap();
					  app.pageInitHome();
					  app.pageInitAbout();   
					  app.pageDeviceOption();
					  app.pageInitUpdateList();
		},  
		initialize:function(){      
			   // this.deleteAllDevice();    
			    cordova.plugins.locationManager.requestAlwaysAuthorization();
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
			    this.getMyDevice(this.getMyLists,this.loadFrameworkAndHome); 
				
			      
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
				 // app.viewMain.params.dynamicNavbar = true;				       
                  /**  
                   * devo bloccare momentaneamente l'aggiornamento della home altrimenti
                   * mi fa sparire il "delete", lo ripristino in chiusura
                   */				  
				  $$('.swipeout.swipeDevice').on('open', function (e) {
					  var idDevice = $$(this).attr('idDevice');
					 clearInterval(app.intervalHome);
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
		deleteList:function(tx,idList){
			tx.executeSql('delete from LISTS where id = ? ',[idList]),
		    tx.executeSql('delete from DEVICEINLIST where idlist = ? ',[idList]) 
		},         
		pageInitAbout:function(){
			  
			 app.iPickView.onPageInit('about', function (page) {
				// app.iPickView.showPreloader();
				// app.viewMain.params.dynamicNavbar = true;
				 clearInterval(app.intervalHome);  
				 app.stopStop();
				 var addressItrackSelected = page.query.address;
				 //app.connectToDevice(addressItrackSelected);
				  
				 app.intervalAbout = setInterval(function(){
					 var device  = app.devices[addressItrackSelected];  
					          
					 device.readRSSI(    
					   function(rssi){
						   if (rssi<= 0){
							   	var rssiDist = app.calculateRssiDist(rssi); 
							   	$$(".row").children('div').removeClass('col-100-big');
							   	$$(".row").children('div').children('div').removeClass('antenna-big');
							   	var antenna = 1;
							   	if (rssiDist<=300){
							   		antenna = 5;
							   	}    
							   	else if (rssiDist<=2000){
							   		antenna = 4;
							   	}
							   	else if(rssiDist<=5000){
							   		antenna = 3;   
							   	}
							   	else if (rssiDist <= 10000){
							   		antenna = 2;  
							   	}
							   	else{    
							   		antenna = 1;  
							   	}  
							   	$$( ".row div:nth-child("+ antenna  +")").addClass('col-100-big'); 
							   	$$($$( ".row div:nth-child("+ antenna +")")).children('div').addClass('antenna-big');
						   }
						 
					 },
					 function(fail){
						 
					 });
					 
					 
					 
				 },5000);  
				 
				 $$("#bell_ring").on('click',function(){
					 app.onToggleButton(addressItrackSelected);  
				 });
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
				   app.openCamera('camera-thmb','largeImageDeviceOption',device,app.setUpdateDeviceFoto);	  
				});
				
				$$("#updateDevice").on('click',function(){
					//if($$("#namePick_id").val() && app.newDeviceFoto){
						app.updateDevice(page.query.id, $$("#namePick_id").val(), app.updateDeviceFoto,$$("#safetymode_id").prop("checked"));
						window.location='index.html';                      
				});  
				 
				 
			 });
		},
		pageInitUpdateList: function(){
			 app.iPickView.onPageInit('updateList', function (page) {
				 
				 
				 for (var i=0;i<app.myLists.length;i++){
					 if (app.myLists[i].id == page.query.id){
						 var image = document.getElementById('largeImageListUpd');    
				    	 image.src =  "data:image/jpeg;base64,"+app.myLists[i].image;  
				    	 app.updateListFoto = app.myLists[i].image;
				    	 break;
					 }
  				 }
				 
				 var colorChoosen = '';
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
							   case 'orangeColor':{
								   $$('.create-picker').css('background','orange');
								   colorChoosen = 'orange';
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
					   app.openCamera('camera-thmb','largeImageList','',app.setFotoUpdateList);	  
					});
					
					$$("#saveUpdateList").on('click',function(){
						app.saveUpdateList(page.query.id,$$("#List_id_upd").val(),colorChoosen);
						window.location='index.html';              
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
					 console.log("eja");        
				   });  
				                      
				   $$('.swipeout.swipeList').on('deleted', function (e) {
					var idList = $$(this).attr('idList')*1;
					app.db.transaction( 
					       function(tx){
					    	   app.deleteList(tx,idList)
					    	   for (var i=0;i<app.myLists.length;i++){
					    		   if (app.myLists[i].id == idList){
					    			   app.myLists.splice(i, 1);
					    			   break;
					    		   }         
					    	   }
					    		$$(this).remove();  
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
										   deviceDisconnected+= results.rows.item(i).name + ' ';	   //
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
			if ($.isEmptyObject(app.myLists)){     
					//app.showMyDevice();            
					 app.addNewList();   
					 $$("#add_listId").hide();    
					return;  
			}else{    
				app.listView.router.load({
				    url: 'list.html',
				    animatePages: false,
				    contextName:'devices'
				  
				});
				app.pageInitList();
				app.pageInitListDetail();    
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
				 //app.mapView.params.dynamicNavbar = true;
				 $$("#mapTab").on('click',function(){
					 app.renderMap();
				 });     
				
			  });  
			
		},
		renderMap:function(){
			if (!app.map){
				if (!app.currentPosition){ 
					app.getCurrentPosition();
				}
			}else{
				setTimeout(app.resizeMap,1000);
			}
			   
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
            		 
            		 if (!app.myDevices[i].lat && app.currentPosition.Lat){
            			 app.myDevices[i].lat = app.currentPosition.Lat ;
						 app.myDevices[i].long = app.currentPosition.Long ;
            		 }    
            		 
        			  if (app.myDevices[i].connected == 'connected'){
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
            	 
              /* 	 app.map.setCenter({    
   	        	  lat:app.currentPosition.Lat,
   	        	  lng:app.currentPosition.Long
   	          });*/
            }
			
		},    
		getDate:function(timestamp){    
			var dataDaFormattare = new Date(timestamp);
			     
			var dataFormattata = dataDaFormattare.getDate()+'/'+(dataDaFormattare.getMonth()+1)+'/'+dataDaFormattare.getFullYear();
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
				   $$("#logoPick").prop("src",app.logoInBase64);
				  //app.updateConnectionDeviceNotFound();
			  },2000);      
			      
			  app.intervalPositionFn(); 
		},       
		setIntervalConnectDevice: function(){
			app.intervalConnectionDevice = setInterval(function(){
				app.connectToDevice(false);  
			},3000);
		},    
		intervalPositionFn:function(){
			  app.intervalPosition = setInterval(function(){
				  app.getCurrentPosition();
			  },15000);       
		},  
		stopStop:function(){
			//app.updateConnectionDeviceNotFound();
			evothings.easyble.stopScan();  
			//app.disconnectToDevice();  
		},         
		      
		addNewDevice:function (){
			 //$.mobile.changePage("#newDevice",{transition: "slide",  allowSamePageTransition: true,reloadPage: false }); 
			clearInterval(app.intervalHome);
			clearInterval(app.intervalConnectionDevice);
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
			app.temporizzatoreCount = 0;
			    
			//app.startScan(true); 
			
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
		addNewList: function(){  
			app.listView.router.load({
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
							   case 'orangeColor':{
								   $$('.create-picker').css('background','orange');
								   colorChoosen = 'orange';
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
					
					$$('#cancelPicker_btn').on('click', function () {
						app.iPickView.closeModal('.picker-info-list');
					})
					
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
			var j = 0;
			 for (var i=0;i<app.myDevices.length;i++){
				 if (app.myDevices[i].address == device.address){
				     app.myDevices[i].lastUpdate = Date.now();
					 app.myDevices[i].connected = 'connected';
					 if (device.rssi <= 0){
						 app.myDevices[i].rssi = app.calculateRssiDist(device.rssi);
					 }  
					 if (app.currentPosition){   
						 var lat =  app.currentPosition.Lat+j;
						 app.myDevices[i].lat = app.currentPosition.Lat ;
						 app.myDevices[i].long = app.currentPosition.Long ;
						
						 var id = app.myDevices[i].id;
						 app.db.transaction(function(tx){
						  tx.executeSql('update devices set lat = ? , long = ? , last_seen = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,device.lastSeen,id], 
							 function(tx, results){  
							}, app.errorCB);  
						   }); 
					 }      
		     }            
		  }  
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
				 if (app.myDevices[dev].address == address && !app.devices[address].alerted){
				 app.devices[address].alerted = true;
				 app.myDevices[dev].lastUpdate = Date.now();
				 
				 if (app.currentPosition){   
					 var lat =  app.currentPosition.Lat;
					 app.myDevices[dev].lat = app.currentPosition.Lat ;
					 app.myDevices[dev].long = app.currentPosition.Long ;
					 var now = Date.now();
					 var id = app.myDevices[dev].id;
					 app.db.transaction(function(tx){
					  tx.executeSql('update devices set lat = ? , long = ? , last_seen = ? where id = ?', [app.currentPosition.Lat,app.currentPosition.Long,now,id], 
						 function(tx, results){  
						}, app.errorCB);  
					   }); 
				 }      
				    
				 
				 if (app.atBackground && app.myDevices[dev].safetymode=="checked"){           
					 cordova.plugins.notification.local.schedule({
			    			id: app.idNotification,
			    			title: app.myDevices[dev].name });
					 app.idNotification++; 
				 }
				 
				 app.myDevices[dev].connected = 'notconnected';  
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
		updateLocalStorageDevice:function(){
			localStorage.setItem('devicesPick', JSON.stringify(app.devices));
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
						app.updateLocalStorageDevice();
				    }         
					if (newDev){  
						app.connectToDevice(true,device);
					}
				},      
				function(error)      
				{     
					console.log("sti cazzi");  
				},
				 { serviceUUIDs: ['0000fff0-0000-1000-8000-00805f9b34fb','0000ffe0-0000-1000-8000-00805f9b34fb','00001802-0000-1000-8000-00805f9b34fb'] }
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
					evothings.easyble.closeConnectedDevices();
				});     
				
			}else{
				
			for (var i in app.devices){
				  
                 var device = app.devices[i];
				if (device && app.isMyDevice(device.address)  && !device.isConnected()){
			  
				device.connect(       
					function(device)    
					{       
						app.devices[i].alerted = false;  
						app.devices[i].connected = 'connected';  
					    app.updateConnectionDeviceFound(device);
					    app.readServices(device,false);            
					},    
					function(errorCode)   
					{  
						//app.setNotConnectedDevice(device);//app.devices[i].connected = 'notconnected';  
					
						if (errorCode.indexOf('device already connected') !== -1){
							device.close();
						}
						else{
							app.alertDeviceConnectionLost(device.address);
							delete app.devices[i];  
							app.showInfo('Error: Connection failed: ' + errorCode + ' and deviceAddress: '+i); 
						}       
					});
				 
				}  
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
					    	  }
					      }
					      
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
		setNotConnectedDevice: function(device){
			for (var i=0;i<app.myDevices.length;i++){
				if (app.myDevices[i].address == device.address){
					app.myDevices[i].connected = 'notconnected';
				}
			}
		},
		
		chooseOptionsNewDevice: function(device){
			//$.mobile.changePage("#optionNewDevice",{transition: "slide",  allowSamePageTransition: true,reloadPage: false });  
			app.stopStop();
			app.viewMain.router.load({   
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
		    
		    if (!app.map){
	    	  app.map = new google.maps.Map(document.getElementById('mapDiv'), {  
		          zoom: 15,
		          center: {  
		        	  lat:app.currentPosition.Lat,
		        	  lng:app.currentPosition.Long
		          }
				});
	    	  
		    	  app.map.setCenter({    
	   	        	  lat:app.currentPosition.Lat,
	   	        	  lng:app.currentPosition.Long
	   	          });
	    	  
		    }
				app.setMarkerDevices();
	    	
	    	
	     //  app.renderMap();
		},
		onMapError:function(){
			return '';
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
					}, app.errorCB);
		    });    
		},   
		updateList: function(id,name,color){
			var idList = id*1;
			app.db.transaction(function(tx){
				  tx.executeSql('update lists set name = ? ,image = ? ,color = ? where id = ?', [name,app.updateListFoto,color,idList],   
					 function(tx, results){    
					}, app.errorCB);
		    });    
		},
		saveNewList:function(nameList,color){
			app.setMyList(nameList,color);
		},
		saveUpdateList:function(idList,nameList,color){
			app.updateList(idList,nameList,color);
		},
		logClick:function(device){
			console.log("log click");
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
   
        
 
        
