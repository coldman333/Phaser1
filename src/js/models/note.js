'use strict';
define(
	[ "backbone"] ,
	function(Backbone){

		var Note = Backbone.Model.extend({

			defaults: {
				title: null,
				description: null
			},
			validate: function(attrs){

				if(attrs.title.trim() == ""  || attrs.description.trim() == "" ){

					return " Empty  Title or Description ! ";
				} 
			}

		});
		return Note;

	});