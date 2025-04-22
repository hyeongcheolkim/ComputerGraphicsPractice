"use strict";

import * as mat4 from "./gl-matrix/mat4.js"
import * as vec4 from "./gl-matrix/vec4.js"
import { toRadian } from "./gl-matrix/common.js"

/** @type {HTMLCanvasElement} */

function main() {
    let canvas = document.getElementById('webgl');
    let gl = canvas.getContext('webgl2');
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.1, 0.1, 0.1, 1);

    const BULLET_LIMIT = 3;

    let azimuth = 45;
    let elevation = 30;
    let fov = 50;
    let V = mat4.create();
    let P = mat4.create();
    let axes = new Axes(gl);
    let terrain = new Terrain(gl);
    let drone = new Drone(gl);
    let bullets = [];
    
    document.getElementsByTagName("BODY")[0].onkeydown = function (ev) {
        switch (ev.key) {
            case 'ArrowUp':
                if (ev.getModifierState("Shift")) elevation += 5;
                else {
                    drone.x += 0.1 * Math.cos(toRadian(drone.angle));
                    drone.y += 0.1 * Math.sin(toRadian(drone.angle));
                }
                break;
            case 'ArrowDown':
                if (ev.getModifierState("Shift")) elevation += -5;
                else {
                    drone.x -= 0.1 * Math.cos(toRadian(drone.angle));
                    drone.y -= 0.1 * Math.sin(toRadian(drone.angle));
                }
                break;
            case 'ArrowLeft':
                if (ev.getModifierState("Shift")) azimuth += 5;
                else drone.angle += 5;
                break;
            case 'ArrowRight':
                if (ev.getModifierState("Shift")) azimuth += -5;
                else drone.angle -= 5;
                break;
            case 'a':
            case 'A':
                drone.z += 0.05;
                break;
            case 'z':
            case 'Z':
                drone.z -= 0.05;
                break;
            case ' ':
                if (bullets.length < BULLET_LIMIT)
                    bullets.push(new Bullet(gl, drone.x, drone.y, drone.z, drone.angle));
                break;
            case '=':
            case '+':
                fov = Math.max(fov - 5, 5);
                break;
            case '-':
            case '_':
                fov = Math.min(fov + 5, 120);
                break;
        }
        let keystroke = "";
        if (ev.getModifierState("Shift")) keystroke += "Shift + ";
        if (ev.key == ' ') keystroke += 'SpaceBar';
        else keystroke += ev.key;
        document.getElementById("output").innerHTML = keystroke;
    };

    let tick = function () {
        mat4.perspective(P, toRadian(fov), 1, 1, 100);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        transform_view(V, azimuth, elevation);
        axes.render(gl, V, P);
        terrain.render(gl, V, P);
        drone.render(gl, V, P);
        bullets.forEach(e => e.move());
        bullets = bullets.filter(e => { return e.z >= 0; })
        bullets.forEach(e => e.render(gl, V, P));
        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };
    tick();
}

class Axes {
    static h_prog = null;
    static loc_aPosition = 5;
    static loc_aColor = 9;
    static shader = null;
    static src_shader_vert = `#version 300 es
    layout(location=${Axes.loc_aPosition}) in vec4 aPosition;
    layout(location=${Axes.loc_aColor}) in vec4 aColor;
    uniform mat4 MVP;
    out vec4 vColor;
    void main()
    {
        gl_Position = MVP * aPosition;
        vColor = aColor;
    }`;
    static src_shader_frag = `#version 300 es
    #ifdef GL_ES
    precision mediump float;
    #endif
    in vec4 vColor;
    out vec4 fColor;
    void main()
    {
        fColor = vColor;
    }`;
    constructor(gl, length = 2) {
        this.MVP = mat4.create();
        if (!Axes.h_prog)
            Axes.h_prog = init_shaders(gl, Axes.src_shader_vert, Axes.src_shader_frag);
        this.init_vbo(gl, length);
    }
    init_vbo(gl, l) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        const vertices = new Float32Array([
            0, 0, 0, 1, 0, 0,
            l, 0, 0, 1, 0, 0,
            0, 0, 0, 0, 1, 0,
            0, l, 0, 0, 1, 0,
            0, 0, 0, 0, 0, 1,
            0, 0, l, 0, 0, 1,
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const SIZE = vertices.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(Axes.loc_aPosition, 3, gl.FLOAT, false, SIZE * 6, 0);
        gl.enableVertexAttribArray(Axes.loc_aPosition);
        gl.vertexAttribPointer(Axes.loc_aColor, 3, gl.FLOAT, false, SIZE * 6, SIZE * 3);
        gl.enableVertexAttribArray(Axes.loc_aColor);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
    }
    render(gl, V, P) {
        gl.useProgram(Axes.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Axes.h_prog, V, P);
        gl.drawArrays(gl.LINES, 0, 6);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

class Terrain {
    static h_prog = null;
    static shader = null;
    static src_shader_vert = `#version 300 es
    in vec2 a_position;
    in vec2 a_texcoord;
    uniform mat4 u_matrix;
    uniform sampler2D u_texture;
    out vec2 v_texcoord;
    void main() {
      gl_Position = u_matrix * vec4(a_position.xy, texture(u_texture, a_texcoord).z, 1);
      v_texcoord = a_texcoord;
    }
    `;
    static src_shader_frag = `#version 300 es
    precision highp float;
    in vec2 v_texcoord;
    uniform sampler2D u_texture;
    out vec4 outColor;
    void main() {
      outColor = vec4(texture(u_texture, v_texcoord).x/3.0+0.1,texture(u_texture, v_texcoord).yz/3.0,texture(u_texture, v_texcoord).w);
    }
    `;
    constructor(gl) {
        this.MVP = mat4.create();
        if (!Terrain.h_prog)
            Terrain.h_prog = init_shaders(gl, Terrain.src_shader_vert, Terrain.src_shader_frag);
        this.positionAttributeLocation = gl.getAttribLocation(Terrain.h_prog, "a_position");
        this.texcoordAttributeLocation = gl.getAttribLocation(Terrain.h_prog, "a_texcoord");
        this.indices = [];
        this.init(gl);
    }
    init(gl) {
        const length = 2;
        const EA = 256;
        const FACTOR = 2 * length / EA;
        let positionBuffer = gl.createBuffer();
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        let position = [];
        for (let y = 0; y <= EA; ++y)
            for (let x = 0; x <= EA; ++x) {
                position.push(...[-length + FACTOR * x, -length + FACTOR * y]);
            }
        let vertices = new Float32Array(position);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.indices = [];
        for (let idx = 0; idx + (EA + 1) < (EA + 1) * (EA + 1); ++idx) {
            if (idx % (EA + 1) != EA)
                this.indices.push(...[idx, idx + 1, idx + (EA + 1)]);
            if (idx % (EA + 1) != 0)
                this.indices.push(...[idx, idx + (EA + 1), idx + (EA)]);
        }
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        let texcoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
        let texCoord = [];
        for (let y = 0; y <= EA; ++y)
            for (let x = 0; x <= EA; ++x)
                texCoord.push(...[x / EA, y / EA]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.texcoordAttributeLocation);
        gl.vertexAttribPointer(this.texcoordAttributeLocation, 2, gl.FLOAT, true, 0, 0);
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        let image = new Image();
        image.src = "/resource/proj3/src/yorkville.jpg";
        image.addEventListener('load', function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
        });
    }
    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "u_matrix"), false, this.MVP);
    }
    render(gl, V, P) {
        gl.useProgram(Terrain.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Terrain.h_prog, V, P);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

class Drone {
    static h_prog = null;
    static loc_aPosition = 5;
    static loc_aColor = 9;
    static shader = null;
    static src_shader_vert = `#version 300 es
    layout(location=${Drone.loc_aPosition}) in vec4 aPosition;
    layout(location=${Drone.loc_aColor}) in vec4 aColor;
    uniform mat4 MVP;
    out vec4 vColor;
    void main()
    {
        gl_Position = MVP * aPosition;
        vColor = aColor;
    }`;
    static src_shader_frag = `#version 300 es
    #ifdef GL_ES
    precision mediump float;
    #endif
    in vec4 vColor;
    out vec4 fColor;
    void main()
    {
        fColor = vec4(vColor.xyz/2.0, vColor.w);
    }`;
    constructor(gl) {
        this.MVP = mat4.create();
        if (!Drone.h_prog)
            Drone.h_prog = init_shaders(gl, Drone.src_shader_vert, Drone.src_shader_frag);
        this.init_vbo(gl);
        this.x = 0;
        this.y = 0;
        this.z = 1;
        this.angle = 0;
    }
    init_vbo(gl) {
        const droneSize = 0.1;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        const vertices = new Float32Array([
            droneSize, droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,
            droneSize, -droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,
            -droneSize, droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,
            droneSize, -droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,
            -droneSize, -droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,
            -droneSize, droneSize, -droneSize, 100 / 255, 120 / 255, 160 / 255,

            droneSize, droneSize, droneSize, 150 / 255, 170 / 255, 80 / 255,
            droneSize, -droneSize, droneSize, 150 / 255, 170 / 255, 80 / 255,
            droneSize, -droneSize, -droneSize, 150 / 255, 170 / 255, 80 / 255,
            droneSize, droneSize, droneSize, 150 / 255, 170 / 255, 80 / 255,
            droneSize, -droneSize, -droneSize, 150 / 255, 170 / 255, 80 / 255,
            droneSize, droneSize, -droneSize, 150 / 255, 170 / 255, 80 / 255,

            -droneSize, droneSize, -droneSize, 200 / 255, 70 / 255, 120 / 255,
            -droneSize, -droneSize, -droneSize, 200 / 255, 70 / 255, 120 / 255,
            -droneSize, droneSize, droneSize, 200 / 255, 70 / 255, 120 / 255,
            -droneSize, -droneSize, -droneSize, 200 / 255, 70 / 255, 120 / 255,
            -droneSize, -droneSize, droneSize, 200 / 255, 70 / 255, 120 / 255,
            -droneSize, droneSize, droneSize, 200 / 255, 70 / 255, 120 / 255,

            droneSize, droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,
            -droneSize, -droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,
            droneSize, -droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,
            -droneSize, -droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,
            droneSize, droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,
            -droneSize, droneSize, droneSize, 80 / 255, 120 / 255, 200 / 255,

            droneSize, -droneSize, droneSize, 80 / 255, 70 / 255, 100 / 255,
            -droneSize, -droneSize, droneSize, 80 / 255, 70 / 255, 100 / 255,
            droneSize, -droneSize, -droneSize, 80 / 255, 70 / 255, 100 / 255,
            -droneSize, -droneSize, droneSize, 80 / 255, 70 / 255, 100 / 255,
            -droneSize, -droneSize, -droneSize, 80 / 255, 70 / 255, 100 / 255,
            droneSize, -droneSize, -droneSize, 80 / 255, 70 / 255, 100 / 255,

            -droneSize, droneSize, droneSize, 30 / 255, 70 / 255, 150,
            droneSize, droneSize, droneSize, 30 / 255, 70 / 255, 150,
            droneSize, droneSize, -droneSize, 30 / 255, 70 / 255, 150,
            -droneSize, droneSize, droneSize, 30 / 255, 70 / 255, 150,
            droneSize, droneSize, -droneSize, 30 / 255, 70 / 255, 150,
            -droneSize, droneSize, -droneSize, 30 / 255, 70 / 255, 150,
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const SIZE = vertices.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(Drone.loc_aPosition, 3, gl.FLOAT, false, SIZE * 6, 0);
        gl.enableVertexAttribArray(Drone.loc_aPosition);
        gl.vertexAttribPointer(Drone.loc_aColor, 3, gl.FLOAT, false, SIZE * 6, SIZE * 3);
        gl.enableVertexAttribArray(Drone.loc_aColor);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        mat4.translate(this.MVP, this.MVP, [this.x, this.y, this.z]);
        mat4.rotateZ(this.MVP, this.MVP, toRadian(this.angle));
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
    }
    render(gl, V, P) {
        gl.useProgram(Drone.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Drone.h_prog, V, P);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

class Bullet {
    static h_prog = null;
    static loc_aPosition = 5;
    static loc_aColor = 9;
    static shader = null;
    static src_shader_vert = `#version 300 es
    layout(location=${Bullet.loc_aPosition}) in vec4 aPosition;
    layout(location=${Bullet.loc_aColor}) in vec4 aColor;
    uniform mat4 MVP;
    out vec4 vColor;
    void main()
    {
        gl_Position = MVP * aPosition;
        vColor = aColor;
    }`;
    static src_shader_frag = `#version 300 es
    #ifdef GL_ES
    precision mediump float;
    #endif
    in vec4 vColor;
    out vec4 fColor;
    void main()
    {
        fColor = vColor;
    }`;
    constructor(gl, x, y, z, angle) {
        this.MVP = mat4.create();
        if (!Bullet.h_prog)
            Bullet.h_prog = init_shaders(gl, Bullet.src_shader_vert, Bullet.src_shader_frag);
        this.init_vbo(gl);
        this.x = x;
        this.y = y;
        this.z = z;
        this.vz = 0;
        this.angle = angle;
    }
    move() {    
        let v0 = 0.02;
        let g = 0.00001;
        this.x += v0 * Math.cos(toRadian(this.angle));
        this.y += v0 * Math.sin(toRadian(this.angle));
        this.vz += g;
        this.z -= (this.vz ** 2) / (2 * g);
    }
    init_vbo(gl) {
        const bulletSize = 0.02;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        const vertices = new Float32Array([
            bulletSize, bulletSize, -bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, -bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, -bulletSize, 1, 1, 1,

            bulletSize, bulletSize, bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            bulletSize, bulletSize, bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            bulletSize, bulletSize, -bulletSize, 1, 1, 1,

            -bulletSize, bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, bulletSize, 1, 1, 1,

            bulletSize, bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            bulletSize, bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, bulletSize, 1, 1, 1,

            bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, bulletSize, 1, 1, 1,
            -bulletSize, -bulletSize, -bulletSize, 1, 1, 1,
            bulletSize, -bulletSize, -bulletSize, 1, 1, 1,

            -bulletSize, bulletSize, bulletSize, 1, 1, 1,
            bulletSize, bulletSize, bulletSize, 1, 1, 1,
            bulletSize, bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, bulletSize, 1, 1, 1,
            bulletSize, bulletSize, -bulletSize, 1, 1, 1,
            -bulletSize, bulletSize, -bulletSize, 1, 1, 1,
        ]);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        const SIZE = vertices.BYTES_PER_ELEMENT;
        gl.vertexAttribPointer(Bullet.loc_aPosition, 3, gl.FLOAT, false, SIZE * 6, 0);
        gl.enableVertexAttribArray(Bullet.loc_aPosition);
        gl.vertexAttribPointer(Bullet.loc_aColor, 3, gl.FLOAT, false, SIZE * 6, SIZE * 3);
        gl.enableVertexAttribArray(Bullet.loc_aColor);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    set_uniform_matrices(gl, h_prog, V, P) {
        mat4.copy(this.MVP, P);
        mat4.multiply(this.MVP, this.MVP, V);
        mat4.translate(this.MVP, this.MVP, [this.x, this.y, this.z]);
        mat4.rotateZ(this.MVP, this.MVP, toRadian(this.angle));
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP);
    }
    render(gl, V, P) {
        gl.useProgram(Bullet.h_prog);
        gl.bindVertexArray(this.vao);
        this.set_uniform_matrices(gl, Bullet.h_prog, V, P);
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

main();

function transform_view(V, azimuth, elevation) {
    mat4.fromTranslation(V, [0, 0, -6]);
    mat4.rotate(V, V, toRadian(elevation), [1, 0, 0]);
    mat4.rotate(V, V, -toRadian(azimuth), [0, 1, 0]);
    mat4.rotate(V, V, -toRadian(90), [0, 1, 0]);
    mat4.rotate(V, V, -toRadian(90), [1, 0, 0]);
}

function init_shader(gl, type, src) {
    let h_shader = gl.createShader(type);
    if (!h_shader) return null;
    gl.shaderSource(h_shader, src);
    gl.compileShader(h_shader);
    let status = gl.getShaderParameter(h_shader, gl.COMPILE_STATUS);
    if (!status) {
        let err = gl.getShaderInfoLog(h_shader);
        console.log(`Failed to compile shader (${err})`);
        gl.deleteShader(h_shader);
        return null;
    }
    return h_shader;
}

function init_shaders(gl, src_vert, src_frag) {
    let h_vert = init_shader(gl, gl.VERTEX_SHADER, src_vert);
    let h_frag = init_shader(gl, gl.FRAGMENT_SHADER, src_frag);
    if (!h_vert || !h_frag) return null;
    let h_prog = gl.createProgram();
    if (!h_prog) return null;
    gl.attachShader(h_prog, h_vert);
    gl.attachShader(h_prog, h_frag);
    gl.linkProgram(h_prog);
    let status = gl.getProgramParameter(h_prog, gl.LINK_STATUS);
    if (!status) {
        let err = gl.getProgramInfoLog(h_prog);
        console.log(`Failed to link program (${err})`);
        gl.deleteProgram(h_prog);
        gl.deleteShader(h_vert);
        gl.deleteShader(h_frag);
        return null;
    }
    return h_prog;
}