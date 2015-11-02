
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJtYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxucmVxdWlyZS5jb25maWcoe1xuXG4gICAgIFxuICAgICAgICBzaGltOiB7XG4gICAgICAgICAgICBcInVuZGVyc2NvcmVcIjp7XG4gICAgICAgICAgICAgICAgZXhwb3J0czonXydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBcImJhY2tib25lXCI6IHtcbiAgICAgICAgICAgICAgICAgIFwiZGVwc1wiOiBbIFwidW5kZXJzY29yZVwiLCBcImpxdWVyeVwiIF0sXG4gICAgICAgICAgICAgICAgICBcImV4cG9ydHNcIjogXCJCYWNrYm9uZVwiIFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxvY2Fsc3RvcmFnZTp7XG4gICAgICAgICAgICAgICAgXCJkYXBzXCI6IFtcImJhY2tib25lXCJdLFxuICAgICAgICAgICAgICAgIFwiZXhwb3J0c1wiOlwibG9jYWxzdG9yYWdlXCJcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9ICxcbiAgICAgICAgICAgcGF0aHM6IHtcbiAgICAgICAgICAgIFwianF1ZXJ5XCI6IFwiL2pzL2xpYi9qcXVlcnktMS4xMS4zXCIsXG4gICAgICAgICAgICBcInVuZGVyc2NvcmVcIjogXCIvanMvbGliL3VuZGVyc2NvcmVcIixcbiAgICAgICAgICAgIFwiYmFja2JvbmVcIjogXCIvanMvbGliL2JhY2tib25lLTEuMi4wXCIsXG4gICAgICAgICAgICBcImxvY2Fsc3RvcmFnZVwiOiBcIi9qcy9saWIvYmFja2JvbmUubG9jYWxTdG9yYWdlXCJcbiAgICAgICAgfVxuXG4gICAgICB9KTsgXG5cbnJlcXVpcmUoW1wiYXBwXCJdLCBmdW5jdGlvbihNYWluQXBwKXtcblxuICAgIHdpbmRvdy5BcHAgPSB7fVxuXG4gICAgTWFpbkFwcC5pbml0aWFsaXplKCk7XG5cbn0pIl0sImZpbGUiOiJtYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
