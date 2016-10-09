// Initialize your app


// Export selectors engine
var $$ = Dom7;

var i=false;



var myApp = new Framework7({
	template7Pages: true,
	precompileTemplates: true, 
	allowDuplicateUrls:true,
	onAjaxStart:function(){
		myApp.showPreloader();
	},
	onAjaxComplete:function(){
		myApp.hidePreloader();
	},
	template7Data : {
		'pippo' : {
			'gigi' : [ {
				'itemName' : 'Chiavi',
				'list_color':[{'name':'azzurro'}]
			}, {
				'itemName' : 'Pc',
				'list_color':[{'name':'azzurro'},
				              {'name':'yellow'},
				              {'name':'fucsia'}]
			}, {
				'itemName' : 'Portafoglio',
				'list_color':[{'name':'azzurro'},
				              {'name':'fucsia'}]
			} ]
		}

	}

	
});

var viewMain = myApp.addView('.view-main', {});

viewMain.router.load({
    url: 'home.html',
    contextName:'pippo',
    animatePages: false
 
});


var listView = myApp.addView('.view-list',{});

listView.router.load({
    url: 'list.html',
   // contextName:'pippo',
    animatePages: false
 
});


myApp.onPageInit('home', function (page) {
   viewMain.params.dynamicNavbar = true;
});

myApp.onPageInit('listPage', function (page) {
	listView.params.dynamicNavbar = true;
});


/**
 * Se va rifatto un reaload della pagina, va aggiunta la navbar perchè se la
 * perde
 * 
 * 
 * viewMain.router.load({ url: 'home.html', 
 *                       contextName:'pippo', 
 *                       animatePages:
 * 						 false });
 * 
 * $$("#NavigationTabHome").append($$("#navBarList").html())
 */

