
var app = {};  



app.initialize = function()
{ 
	//evothings.scriptsLoaded(app.onDeviceReady) 
	/**
	 * Connected device.  
	 */   
	app.disconnectToDevice();         
	//var t = {"3DB8655B-EC89-5C53-0466-69ECB82177F1":{"name":"Bianco"},"245FE686-2FFB-CAE5-D3F0-9CADF7FE6014":{"name":"Nero"}};  
	//var t = {"A0:E6:F8:56:49:ED":{"name":"Bianco"},"A0:E6:F8:56:48:AE":{"name":"Nero"}};  
	//localStorage.setItem('myDevices',JSON.stringify(t));
	localStorage.setItem('myDevices',JSON.stringify([]));  
    app.devices = [];  
	app.myDevices = JSON.parse(localStorage.getItem('myDevices'));
	app.DeviceConnected = [];
	app.devicesRing = new Array();
	app.deviceSelected = '';

    app.addNewDevice();
	
};
  
app.stopStop = function(){
	
	  evothings.easyble.stopScan();
	  app.disconnectToDevice();  
}       
app.addNewDevice = function(){    
	 app.stopStop();  
     app.startI = setInterval(app.startScan,6000,true);                                                                 
}
                     
            
app.showInfo = function(info)
{
	//document.getElementById('info').innerHTML = info;
	console.log(info);
};
  
   
app.startScan = function(newDev)
{
	evothings.easyble.startScan(
		function(device)
		{  
			if (device.hasName('iTrack')){	
				app.devices[device.address] = device;   
				if (newDev){
					app.connectToDevice(device.address,newDev);     
				}else{
					if (typeof(app.devices[device.address])=='undefined'){  
						app.updateConnectionDeviceFound(device.address);
					}     
				}
		 }
		},
		function(error)    
		{
			app.showInfo('Error: startScan: ' + error);
		});
};
app.disconnectToDevice = function(){
	evothings.easyble.closeConnectedDevices();     
}
/**
 * Read services for a device.
 */
app.connectToDevice = function(deviceAddress,newDev)
{
	var device  = app.devices[deviceAddress]; 
	app.showInfo('Status: Connecting...');
		//evothings.easyble.stopScan();
	 //if (app.DeviceConnected[deviceAddress] == null ){      
		device.connect(
			function(devicet)   
			{     
				app.showInfo('Status: Connected');
				app.readServices(device,newDev);  
			},  
			function(errorCode)  
			{
				app.showInfo('Error: Connection failed: ' + errorCode);      
				//app.stopStop();      
				  
			});
		
      // }
	
};               

app.readServices = function(device,newDev)
{
	// Read all services.
	device.readServices(
		['0000fff0-0000-1000-8000-00805f9b34fb'],
		function(device)
		{
	       app.readPairingMode(device);
  
		},
		function(error)  
		{
			console.log('Error: Failed to read services: ' + error);
		});
};



app.readPairingMode = function(device){
	
	device.readServiceCharacteristic(
	    '0000fff0-0000-1000-8000-00805f9b34fb',
	    '0000fff5-0000-1000-8000-00805f9b34fb',
	    function(data)
	    {
	     
	      var paringMode = new Uint8Array(data)[0];
	      console.log('paringMode: '+ paringMode);     
	      if (paringMode == 1){  
	    	  console.log("trovato il primo device evvviva");     
	      }else{  
	    	  device.close();  
	    	  app.stopStop();               
	      }
	                
	    },      
	    function(errorCode)
	    {  
	      console.log('Pairing mode value error: ' + errorCode);  
	    });


}  



  document.addEventListener("deviceready", app.initialize, false);
  
	    
  

  
 