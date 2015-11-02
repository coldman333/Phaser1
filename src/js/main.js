'use strict';
require.config({
    shim: {
        "underscore":{
            exports:'_'
        },
        "backbone": {
            "deps": [ "underscore", "jquery" ],
            "exports": "Backbone" 
        },
        localstorage:{
            "daps": ["backbone"],
            "exports":"localstorage"
        }
    } ,
    paths: {
        "jquery": "/js/lib/jquery-1.11.3",
        "underscore": "/js/lib/underscore",
        "backbone": "/js/lib/backbone-1.2.0",
        "localstorage": "/js/lib/backbone.localStorage"
    }
}); 

require(["app"], function(MainApp){
    window.App = {}
    MainApp.initialize();
})