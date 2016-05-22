define([
	"Ember",
	"config",
	"mixins/RetryTransitionMixin",
	"models/LivestreamerParameters",
	"utils/node/platform"
], function(
	Ember,
	config,
	RetryTransitionMixin,
	LivestreamerParameters,
	platform
) {

	var get = Ember.get;
	var set = Ember.set;
	var alias = Ember.computed.alias;
	var equal = Ember.computed.equal;

	var themes = config.themes[ "themes" ];
	var langs  = config.langs;


	function settingsAttrMeta( attr, prop ) {
		return function() {
			var settings = get( this, "settings.content" );
			return settings.constructor.metaForProperty( attr ).options[ prop ];
		}.property( "settings.content" );
	}


	return Ember.Controller.extend( RetryTransitionMixin, {
		settings: Ember.inject.service(),
		modal   : Ember.inject.service(),
		chat    : Ember.inject.service(),

		platform : platform,

		hlsLiveEdgeDefault: settingsAttrMeta( "hls_live_edge", "defaultValue" ),
		hlsLiveEdgeMin    : settingsAttrMeta( "hls_live_edge", "minValue" ),
		hlsLiveEdgeMax    : settingsAttrMeta( "hls_live_edge", "maxValue" ),

		hlsSegmentThreadsDefault: settingsAttrMeta( "hls_segment_threads", "defaultValue" ),
		hlsSegmentThreadsMin    : settingsAttrMeta( "hls_segment_threads", "minValue" ),
		hlsSegmentThreadsMax    : settingsAttrMeta( "hls_segment_threads", "maxValue" ),

		retryStreamsDefault: settingsAttrMeta( "retry_streams", "defaultValue" ),
		retryStreamsMin    : settingsAttrMeta( "retry_streams", "minValue" ),
		retryStreamsMax    : settingsAttrMeta( "retry_streams", "maxValue" ),

		retryOpenDefault: settingsAttrMeta( "retry_open", "defaultValue" ),
		retryOpenMin    : settingsAttrMeta( "retry_open", "minValue" ),
		retryOpenMax    : settingsAttrMeta( "retry_open", "maxValue" ),

		chatMethods: function() {
			var methods = get( this, "settings.content.constructor.chat_methods" );
			return methods.filter(function( method ) {
				return !method.disabled;
			});
		}.property( "settings.content" ),

		isChatMethodDefault: equal( "model.chat_method", "default" ),
		isChatMethodMSIE   : equal( "model.chat_method", "msie" ),
		isChatMethodCustom : equal( "model.chat_method", "custom" ),
		isChatMethodChatty : equal( "model.chat_method", "chatty" ),

		themes: function() {
			return themes.map(function( theme ) {
				return {
					id   : theme,
					label: theme.substr( 0, 1 ).toUpperCase() + theme.substr( 1 )
				};
			});
		}.property(),

		hasTaskBarIntegration: equal( "model.gui_integration", 1 ),
		hasBothIntegrations  : equal( "model.gui_integration", 3 ),

		substitutionsPlayer: LivestreamerParameters.playerSubstitutions,
		substitutionsChatCustom: alias( "chat.substitutionsCustom" ),

		minimize_observer: function() {
			var int    = get( this, "model.gui_integration" );
			var min    = get( this, "model.gui_minimize" );
			var noTask = ( int & 1 ) === 0;
			var noTray = ( int & 2 ) === 0;

			// make sure that disabled options are not selected
			if ( noTask && min === 1 ) {
				set( this, "model.gui_minimize", 2 );
			}
			if ( noTray && min === 2 ) {
				set( this, "model.gui_minimize", 1 );
			}

			// enable/disable buttons
			var Settings = get( this, "settings.content.constructor" );
			set( Settings, "minimize.1.disabled", noTask );
			set( Settings, "minimize.2.disabled", noTray );

		}.observes( "model.gui_integration" ),


		languages: function() {
			return Object.keys( langs ).map(function( code ) {
				return {
					id  : code,
					lang: langs[ code ][ "lang" ].capitalize()
				};
			});
		}.property(),


		actions: {
			"apply": function( success, failure ) {
				var modal  = get( this, "modal" );
				var model  = get( this, "settings.content" );
				var buffer = get( this, "model" ).applyChanges().getContent();
				model.setProperties( buffer );
				model.save()
					.then( success, failure )
					.then( modal.closeModal.bind( modal, this ) )
					.then( this.retryTransition.bind( this ) )
					.catch( model.rollbackAttributes.bind( model ) );
			},

			"discard": function( success ) {
				var modal = get( this, "modal" );
				get( this, "model" ).discardChanges();
				Promise.resolve()
					.then( success )
					.then( modal.closeModal.bind( modal, this ) )
					.then( this.retryTransition.bind( this ) );
			},

			"cancel": function() {
				set( this, "previousTransition", null );
				get( this, "modal" ).closeModal( this );
			},

			"togglePlayerCmdSubstitutions": function() {
				this.toggleProperty( "playerCmdSubstitutionsVisible" );
			},

			"checkLanguages": function( all ) {
				var filters = get( this, "model.gui_langfilter" );
				Object.keys( filters.content ).forEach(function( key ) {
					set( filters, key, all );
				});
			}
		}
	});

});
