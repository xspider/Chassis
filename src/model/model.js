/**
 * @fileOverview Model
 */

/**
 * Model
 * @class Model
 * @namespace __Chassis__
 * @constructor
 * @param {object} attributes
 * @param {object} opts
 */
var Model = Chassis.Model = function( attributes, opts ) {
    var me = this,
        attrs = attributes || {},
        defaults;

    if ( !opts ) {
        opts = {};
    }

    
    me.attributes = {};
    me.cid = Chassis.uniqueId( 'c' );
    
    
    attrs = Chassis.mixin( {}, me.defaults || {}, attrs );
    me.set( attrs, opts );

    me.init.apply( me, arguments );
};

Chassis.mixin( Model.prototype, Events, {
    
	/**
     * 模型的特殊属性
     * > `id` 可以是任意字符串。在属性中设置的 `id` 会被直接拷贝到模型属性上。 
     *
     * @property idAttribute
     * @return 
     **/
    idAttribute : 'id',
    
	/**
	 * 初始化
     * > 当创建模型实例时，可以传入 `属性` 初始值，这些值会被 `set` 到模型。 如果定义了 `init` 函数，该函数会在模型创建后执行。
     *
     * @method init
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			},
			init : function(){
				//
			}
		} );
		
        var m = new model();
     **/
    init : function() {},
    
    /**
     * fetch方法获取数据的url。
     * > 注意这个方法的意思和backbone是有区别的
     *
     * @method url
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			},
			url : function(){
				return '/path/?title=' + this.get( 'title' );
			}
		} );
		
        var m = new model();
     **/
    url : function() {},
    
    /**
     * 从模型获取当前属性值
     *
     * @method get
     * @param {string} key
     * @return
	 * @example
		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			}
		} );
		
        var m = new model();
        m.get( 'title' );
     **/
    get : function( key ) {
        return this.attributes[ key ];
    },
    
    /**
	 * 模型是否具有某个属性
     * > 属性值为非 null 或非 undefined 时返回 true
     *
     * @method has
     * @param {string} key
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			}
		} );
		
        var m = new model();
		m.has( 'title' );
     **/
    has : function( key ) {
        return this.get( key ) !== null;
    },
    
    /**
     * 向模型设置一个或多个散列属性。
     * > 如果任何一个属性改变了模型的状态，在不传入 `{silent: true}` 选项参数的情况下，
     * > 会触发 `change` 事件。 
     *
     * @method set
     * @param {string} key
     * @param {*} val
     * @param {object} opts
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			}
		} );
		
        var m = new model();
		m.on( 'change', function(){
			//model has be changed.
		} );
        m.set( 'title', '' );
		
     **/
    set : function( key, val, opts ) {

        var me = this,
            attr, 
            attrs, 
            unset, 
            changes, 
            silent, 
            changing, 
            prev, 
            current;
            
        if ( key === null ) {
            return me;
        }

        if ( typeof key === 'object' ) {
            attrs = key;
            opts = val;
        } else {
            (attrs = {})[ key ] = val;
        }
        
        if ( !opts ) {
            opts = {};
        }
        
        me._previousAttributes = Chassis.clone( me.attributes );
        
        if ( me.idAttribute in attrs ) {
            me[ me.idAttribute ] = attrs[ me.idAttribute ];
        }
        
        Chassis.$.each( attrs, function( key, item ) {
            if ( opts.unset ) {
                delete me.attributes[ key ];
            } else {
                me.attributes[ key ] = item;
            }   
        } );
        
		if ( !opts.silent ) {
			me.trigger( 'change', me );
		}
        
    },
    
    /**
     * 返回模型 `attributes` 副本的 JSON 字符串化形式。 
	 * > 它可用于模型的持久化、序列化，或者传递到视图前的扩充。
     *
     * @method toJSON
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			},
			init : function(){
				//
			}
		} );
		
        var m = new model();
        m.toJSON();		
     **/
    toJSON : function() {
        return Chassis.clone( this.attributes );
    },
    
    /**
     * 手动获取数据
     *
     * @method fetch
     * @param {object} opts
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			},
			url : function(){
				return '/data/?title=' + this.get( 'title' );
			}
		} );
		
        var m = new model();
		m.on( 'change', function(){
			//success
		} );
        m.fetch();	 
     **/
    fetch : function( opts ) {
        var me = this,
            _opt;
        
        opts = opts ? Chassis.clone( opts ) : {};
        
        opts = Chassis.mixin( {}, {
            dataType : 'json',
            success : function() {}
        }, opts );
        
        _opt = Chassis.mixin( {}, opts, {
            url : me.url(),
            success : function( resp ) {
                resp = me.parse( resp, opts );

                opts.success.call( me );
                me.set( resp, opts );
            },
            error : function() {
                me.trigger( 'error' );
            }
        } );
        
        
        me.sync( _opt );
    },
    
    /**
     * 自定义数据解析，建议用自定义的逻辑重载它
     *
     * @method parse
     * @param {object} resp
     * @param {object} opts
     * @return
	 * @example

		var model = __Chassis__.Model.extend( {
			defaults : {
				title : '__Chassis__'
			},
			url : function(){
				return '/data/?title=' + this.get( 'title' );
			},
			parse : function(resp){
				return resp[ 'data' ];
			}
		} );
		
        var m = new model();
		m.on( 'change', function(){
			//success
		} );
        m.fetch();	 
     **/
    parse: function( resp, opts ) {
        return resp;
    },
    
    /**
     * 手动触发 `change` 事件。
     *
     * @method change
     * @return
     * @private	 
     **/
    change : function() {
        this.trigger( 'change' );
    },
    
    sync : function( opts ) {
        return Chassis.$.ajax.call( this, opts );
    }
    
} );

Chassis.mixin( Model, {
    extend: Chassis.extend
} );