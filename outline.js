var Outline = pc.createScript('outline');


Outline.attributes.add('color', {
    type: 'rgb',
   
    title : "Color",
});

Outline.attributes.add('enable', {
    type: 'boolean',
    default: true,
    title : "Enable",
});

Outline.attributes.add('oWidth', {
    type: 'number',
     default: 2.0,
    title : "Width",
});


// initialize code called once per entity
Outline.prototype.initialize = function() {
    this.renderer = this.app.renderer; 
    var device = this.app.renderer.device; 
    var scene = this.app.scene;
    this.selection = { }; 
    this.render = 0; 
    var cleared = false; 
    this.targets = [ ]; 
    this.textures = [ ];

    var materialFinal = new pc.BasicMaterial();
    var shaderFinal;

    materialFinal.updateShader = function(device) {
        if (! shaderFinal) {
            shaderFinal = new pc.Shader(device, {
                attributes: {
                    aPosition: pc.SEMANTIC_POSITION
                },

                vshader: ' \
                    attribute vec2 aPosition;\n \
                    varying vec2 vUv0;\n \
                    void main(void)\n \
                    {\n \
                        gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                        vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
                    }\n',

                fshader: ' \
                    precision ' + device.precision + ' float;\n \
                    varying vec2 vUv0;\n \
                    uniform sampler2D uColorBuffer;\n \
                    void main(void)\n \
                    {\n \
                        gl_FragColor = texture2D(uColorBuffer, vUv0);\n \
                    }\n'
            });
        }
        this.shader = shaderFinal;
    };
    materialFinal.blend = true;
    materialFinal.blendDst = 8;
    materialFinal.blendEquation = 0;
    materialFinal.blendSrc = 6;
    materialFinal.blendType = 2;
    materialFinal.depthWrite = true;
    materialFinal.depthTest = true;
    materialFinal.update();


    this.shaderBlurH = new pc.Shader(device, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION 
        },

        vshader: ' \
            attribute vec2 aPosition;\n \
            varying vec2 vUv0;\n \
            void main(void)\n \
            {\n \
                gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
            }\n',

        fshader: ' \
            precision ' + device.precision + ' float;\n \
            varying vec2 vUv0;\n \
            uniform float uOffset;\n \
            uniform sampler2D uColorBuffer;\n \
            uniform float oWidth; \n \
            void main(void)\n \
            {\n \
                float diff = 0.0;\n \
                vec4 pixel;\n \
                vec4 texel = texture2D(uColorBuffer, vUv0);\n \
                vec4 firstTexel = texel;\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * (-2.0 * oWidth), 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * (-1.0 * oWidth), 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * oWidth, 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(uOffset * (2.0 * oWidth), 0.0));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
            }\n'
    });
    this.shaderBlurV = new pc.Shader(device, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION
        },

        vshader: ' \
            attribute vec2 aPosition;\n \
            varying vec2 vUv0;\n \
            void main(void)\n \
            {\n \
                gl_Position = vec4(aPosition, 0.0, 1.0);\n \
                vUv0 = (aPosition.xy + 1.0) * 0.5;\n \
            }\n',

        fshader: ' \
            precision ' + device.precision + ' float;\n \
            varying vec2 vUv0;\n \
            uniform float uOffset;\n \
            uniform sampler2D uColorBuffer;\n \
            uniform float oWidth; \n \
            void main(void)\n \
            {\n \
                vec4 pixel;\n \
                vec4 texel = texture2D(uColorBuffer, vUv0);\n \
                vec4 firstTexel = texel;\n \
                float diff = texel.a;\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * (-2.0 * oWidth)));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * (-1.0 * oWidth)));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * oWidth));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                pixel = texture2D(uColorBuffer, vUv0 + vec2(0.0, uOffset * (2.0 * oWidth)));\n \
                texel = max(texel, pixel);\n \
                diff = max(diff, length(firstTexel.rgb - pixel.rgb));\n \
                \n \
                gl_FragColor = vec4(texel.rgb, min(diff, 1.0));\n \
            }\n'
    });

    var node = new pc.GraphNode();
    var mesh = new pc.Mesh();

    var vertexFormat = new pc.VertexFormat(device, [
        { semantic: pc.SEMANTIC_POSITION, components: 2, type: pc.TYPE_FLOAT32 }
    ]);
    var vertexBuffer = new pc.VertexBuffer(device, vertexFormat, 4);
    var iterator = new pc.VertexIterator(vertexBuffer);
    iterator.element[pc.SEMANTIC_POSITION].set(-1, -1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(1, -1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(-1, 1);
    iterator.next();
    iterator.element[pc.SEMANTIC_POSITION].set(1, 1);
    iterator.end();
    mesh.vertexBuffer = vertexBuffer;

    var indices = [ 0, 1, 2, 1, 3, 2 ];
    var indexBuffer = new pc.IndexBuffer(device, pc.INDEXFORMAT_UINT16, indices.length);
    var dst = new Uint16Array(indexBuffer.lock());
    dst.set(indices);
    indexBuffer.unlock();
    mesh.indexBuffer[0] = indexBuffer;

    mesh.primitive[0].type = pc.PRIMITIVE_TRIANGLES;
    mesh.primitive[0].base = 0;
    mesh.primitive[0].count = indices.length;
    mesh.primitive[0].indexed = true;

    this.meshInstance = new pc.MeshInstance(node, mesh, materialFinal);
    this.meshInstance.updateKey = function() {
        this.key = pc._getDrawcallSortKey(14, this.material.blendType, false, 0);
    };
    this.meshInstance.layer = 14;
    this.meshInstance.updateKey();
    this.meshInstance.cull = false;
    this.meshInstance.pick = false;
    this.meshInstance.drawToDepth = false;

    scene.drawCalls.push(this.meshInstance);

    // add program lib with outline shader
    device.programLib.register('outline', {
        generateKey: function(device, options) {
            var key = 'outline';
            
          
            return key;
        },
        createShaderDefinition: function(device, options) {
            // attributes
            var attributes = {
                vertex_position: pc.SEMANTIC_POSITION
            };

            // vertex shader
            var chunks = pc.shaderChunks;
            var code = '';

            // vertex start
            code += chunks.transformDeclVS;
            code += chunks.transformVS;
            
            // vertex body
            code += pc.programlib.begin();
            code += "   gl_Position = getPosition();\n";
            code += pc.programlib.end();
            

            var vshader = code;

            // fragment shader
            code = pc.programlib.precisionCode(device);
            code += 'uniform vec4 uColor;\n';
            code += pc.programlib.begin();
            code += "float depth = gl_FragCoord.z / gl_FragCoord.w;\n";
            code += "gl_FragColor = uColor;\n";

            code += pc.programlib.end();
            var fshader = code;

            return {
                attributes: attributes,
                vshader: vshader,
                fshader: fshader
            };
        }
    });

     this.shaderStatic = device.programLib.getProgram('outline', {
        skin: false
     });
     
     this.shaderStaticOp = { };
     this.shaderSkinOp = { };

    this.selection[config.self.id] = [ ];
    this.selection[config.self.id].push(this.entity);
    this.render++;
    
    
    for(var i = 0; i < 2; i++) {
        this.textures[i] = new pc.Texture(device, {
            format: pc.PIXELFORMAT_R8_G8_B8_A8,
            width: device.width,
            height: device.height
        });
        this.textures[i].minFilter = pc.FILTER_NEAREST;
        this.textures[i].magFilter = pc.FILTER_NEAREST;
        this.textures[i].addressU = pc.ADDRESS_CLAMP_TO_EDGE;
        this.textures[i].addressV = pc.ADDRESS_CLAMP_TO_EDGE;

        this.targets[i] = new pc.RenderTarget(device, this.textures[i]);
    }

    this.meshInstance.setParameter('uColorBuffer', this.textures[0]);

    
   
};


// update code called every frame
Outline.prototype.update = function(dt) {
    var device = this.app.renderer.device; // Устройство для вывода
    var scene = this.app.scene; // Сцена, с котороый мы работаем
    var camera = this.app.root.findByName("MainCamera").camera.camera;
    var oldTarget = camera.renderTarget;

    this.meshInstance.setParameter('oWidth', this.oWidth);
    

    if (this.render && this.enable) {
        this.meshInstance.visible = true;
        camera.renderTarget = this.targets[0];
        this.app.renderer.setCamera(camera);

        device.clear({
            color: [ 0, 0, 0, 0 ],
            depth: 1.0,
            flags: pc.CLEARFLAG_COLOR | pc.CLEARFLAG_DEPTH
        });

        var ind = scene.drawCalls.indexOf(this.meshInstance);
        scene.drawCalls.splice(ind, 1);
        scene.drawCalls.push(this.meshInstance);

        var oldBlending = device.getBlending();
        device.setBlending(false);

        var meshes = this.entity.model.meshInstances;
        for(var m = 0; m < meshes.length; m++) {
            var opChan = 'r';
            var instance = meshes[m];

            if (! instance.command && instance.drawToDepth && instance.material && instance.layer === pc.LAYER_WORLD) {
                var mesh = instance.mesh;
                var uColor = device.scope.resolve('uColor');
                uColor.setValue(this.color.data);
                this.renderer.modelMatrixId.setValue(instance.node.worldTransform.data);
                var material = instance.material;
                device.setShader( this.shaderStatic);
                var style = instance.renderStyle;

                device.setVertexBuffer(mesh.vertexBuffer, 0);
                device.setIndexBuffer(mesh.indexBuffer[style]);
                device.draw(mesh.primitive[style]);
                this.renderer._depthDrawCalls++;
            }
        }


        for (var i = 0; i < this.targets.length; i++) {
            camera.renderTarget = this.targets[this.targets.length - 1 - i];
            
            this.renderer.setCamera(camera);
            var mesh = this.meshInstance.mesh;
            var uOffset = device.scope.resolve('uOffset');
            var uColorBuffer = device.scope.resolve('uColorBuffer');
            uOffset.setValue(1.0 / (i === 0 ? device.width: device.height) / 2.0);
            uColorBuffer.setValue(this.textures[i]);
            device.setShader(this["shaderBlur" + (i===0? "H" : "V")]);
            device.setVertexBuffer(mesh.vertexBuffer, 0);
            device.setIndexBuffer(mesh.indexBuffer[0]);
            device.draw(mesh.primitive[0]);
            this.renderer._depthDrawCalls++;    
        }
        
        device.setBlending(oldBlending);
        cleared = false;
    } else {
        this.meshInstance.visible = false;
        cleared = true;
    }

    camera.renderTarget = oldTarget;
};
