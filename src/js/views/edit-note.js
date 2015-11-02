'use strict';
define([
	"jquery",
	'underscore',
	"backbone",
	], function($, _, Backbone ) {

		var EditNoteView = Backbone.View.extend({
			template: _.template($("#editNoteItem").html()),
			initialize: function(){},
			events:{
				'submit .submitForm': 'onFormSubmit' ,
				'click .btn-submit': 'onFormSubmit' ,
				'click .btn-delete': 'onDelete'
			},
			render: function(){

				if(this.model.isNew()){
					this.$el.html(this.template({ title:"",description:""} ));
				} else{
					
					this.$el.append(this.template(this.model.toJSON()));

				}      
				return this;
			},
			onFormSubmit:function(e){
				
				e.preventDefault();

				var formObj = {
					title: this.$(".formTitle").val(),
					description:  this.$(".formDescription").val()
				}

				this.trigger('form:submitted', formObj);

			}


		});

		return EditNoteView;
	});