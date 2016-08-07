pc.script.attribute("color", "rgb", [1,1,1], { displayName: "Color"});
pc.script.attribute("enable", "boolean", true, { displayName: "Enable"});
pc.script.attribute("oWidth", "number", 2.0, {step: 0.1, displayName: "Width"});


pc.script.create('outline', function (app) {
    // Creates a new Outline instance
    var Outline = function (entity) {
        this.entity = entity;
    };

    Outline.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            
            
            this.renderer = app.renderer; 
            var device = this.renderer.device; 
            var scene = app.scene;
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
            materialFinal.depthWrite = false;
            materialFinal.depthTest = false;
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
            
            var vertexFormat = new pc.gfx.VertexFormat(device, [
                { semantic: pc.gfx.SEMANTIC_POSITION, components: 2, type: pc.gfx.ELEMENTTYPE_FLOAT32 }
            ]);
            var vertexBuffer = new pc.gfx.VertexBuffer(device, vertexFormat, 4);
            var iterator = new pc.gfx.VertexIterator(vertexBuffer);
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
            
            device.programLib.register('outline', {
                generateKey: function(device, options) {
                    var key = 'outline';
                    if (options.skin) key += '_skin';
                    if (options.opacityMap) key += '_opam';
                    if (options.instancing) key += '_inst';
                    return key;
                },
                createShaderDefinition: function(device, options) {
                    // attributes
                    var attributes = {
                        vertex_position: pc.SEMANTIC_POSITION
                    };

                    if (options.skin) {
                        attributes.vertex_boneWeights = pc.SEMANTIC_BLENDWEIGHT;
                        attributes.vertex_boneIndices = pc.SEMANTIC_BLENDINDICES;
                    }

                    if (options.opacityMap)
                        attributes.vertex_texCoord0 = pc.SEMANTIC_TEXCOORD0;

                    // vertex shader
                    var chunks = pc.shaderChunks;
                    var code = '';

                    // vertex start
                    code += chunks.transformDeclVS;
                    if (options.skin) {
                        code += pc.programlib.skinCode(device);
                        code += chunks.transformSkinnedVS;
                    } else if (options.instancing) {
                        attributes.instance_line1 = pc.SEMANTIC_TEXCOORD2;
                        attributes.instance_line2 = pc.SEMANTIC_TEXCOORD3;
                        attributes.instance_line3 = pc.SEMANTIC_TEXCOORD4;
                        attributes.instance_line4 = pc.SEMANTIC_TEXCOORD5;
                        code += chunks.instancingVS;
                        code += chunks.transformInstancedVS;
                    } else {
                        code += chunks.transformVS;
                    }
                    if (options.opacityMap) {
                        code += "attribute vec2 vertex_texCoord0;\n\n";
                        code += 'varying vec2 vUv0;\n\n';
                    }

                    // vertex body
                    code += pc.programlib.begin();
                    code += "   gl_Position = getPosition();\n";
                    if (options.opacityMap)
                        code += '    vUv0 = vertex_texCoord0;\n';
                    code += pc.programlib.end();

                    var vshader = code;

                    // fragment shader
                    code = pc.programlib.precisionCode(device);

                    if (options.opacityMap) {
                        code += 'varying vec2 vUv0;\n\n';
                        code += 'uniform sampler2D texture_opacityMap;\n\n';
                        code += chunks.alphaTestPS;
                    }

                    code += 'uniform vec4 uColor;\n';

                    code += pc.programlib.begin();

                    if (options.opacityMap) {
                        code += '    alphaTest(texture2D(texture_opacityMap, vUv0).' + options.opacityChannel + ' );\n\n';
                    }

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
             this.shaderSkin = device.programLib.getProgram('outline', {
                skin: true
            });
             this.shaderStaticOp = { };
             this.shaderSkinOp = { };
            
            this.selection[config.self.id] = [ ];
            this.selection[config.self.id].push(this.entity);
            this.render++;
            
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            
            var device = this.renderer.device; // Устройство для вывода
            var scene = app.scene; // Сцена, с котороый мы работаем
            
            
           
            if (! this.targets[0]) {
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
                
            }
            
            this.meshInstance.setParameter('oWidth', this.oWidth);
            
            var camera = app.root.findByName("Camera").camera.camera;
                
            var oldTarget = camera.getRenderTarget();
            
            if (this.render && this.enable) {
                
                
                this.meshInstance.visible = true;
                camera.setRenderTarget(this.targets[0]);
                this.renderer.setCamera(camera);

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

               
               

                var color = this.color;
                
                var id = config.self.id;

                for(var i = 0; i < this.selection[id].length; i++) {
                   
                    var model = this.selection[id][i].model;
                   
                    
                    var meshes = model.meshInstances;
                    for(var m = 0; m < meshes.length; m++) {
                        var opChan = 'r';
                        var instance = meshes[m];

                        if (! instance.command && instance.drawToDepth && instance.material && instance.layer === pc.LAYER_WORLD) {
                            var mesh = instance.mesh;

                            var uColor = device.scope.resolve('uColor');
                            uColor.setValue(color.data);

                            this.renderer.modelMatrixId.setValue(instance.node.worldTransform.data);

                            var material = instance.material;
                            if (material.opacityMap) {
                                this.renderer.opacityMapId.setValue(material.opacityMap);
                                this.renderer.alphaTestId.setValue(material.alphaTest);
                                if (material.opacityMapChannel) opChan = material.opacityMapChannel;
                            }

                            if (instance.skinInstance) {
                                this.renderer._skinDrawCalls++;
                                this.renderer.skinPosOffsetId.setValue(instance.skinInstance.rootNode.getPosition().data);
                                if (device.supportsBoneTextures) {
                                    var boneTexture = instance.skinInstance.boneTexture;
                                    this.renderer.boneTextureId.setValue(boneTexture);
                                    this.renderer.boneTextureSizeId.setValue([boneTexture.width, boneTexture.height]);
                                } else {
                                    this.renderer.poseMatrixId.setValue(instance.skinInstance.matrixPalette);
                                }
                                device.setShader(material.opacityMap ? this.shaderSkinOp[opChan] : this.shaderSkin);
                            } else {
                                device.setShader(material.opacityMap ? this.shaderStaticOp[opChan] : this.shaderStatic);
                            }

                            var style = instance.renderStyle;

                            device.setVertexBuffer(mesh.vertexBuffer, 0);
                            device.setIndexBuffer(mesh.indexBuffer[style]);
                            device.draw(mesh.primitive[style]);
                            this.renderer._depthDrawCalls++;
                        }
                    }
                }
           
                
                // blur pass X
                camera.setRenderTarget(this.targets[1]);
                this.renderer.setCamera(camera);
                var mesh = this.meshInstance.mesh;
                var uOffset = device.scope.resolve('uOffset');
                var uColorBuffer = device.scope.resolve('uColorBuffer');
                uOffset.setValue(1.0 / device.width / 2.0);
                uColorBuffer.setValue(this.textures[0]);
                device.setShader(this.shaderBlurH);
                device.setVertexBuffer(mesh.vertexBuffer, 0);
                device.setIndexBuffer(mesh.indexBuffer[0]);
                device.draw(mesh.primitive[0]);
                this.renderer._depthDrawCalls++;
             
                // blur pass Y
                camera.setRenderTarget(this.targets[0]);
                this.renderer.setCamera(camera);
                var mesh = this.meshInstance.mesh;
                var uOffset = device.scope.resolve('uOffset');
                var uColorBuffer = device.scope.resolve('uColorBuffer');
                uOffset.setValue(1.0 / device.height / 2.0);
                uColorBuffer.setValue(this.textures[1]);
                device.setShader(this.shaderBlurV);
                device.setVertexBuffer(mesh.vertexBuffer, 0);
                device.setIndexBuffer(mesh.indexBuffer[0]);
                device.draw(mesh.primitive[0]);
                this.renderer._depthDrawCalls++;

                device.setBlending(oldBlending);
                cleared = false;
            } else {
                this.meshInstance.visible = false;
                cleared = true;
            }
            
            camera.setRenderTarget(oldTarget);
            
        }
    };

    return Outline;
});
