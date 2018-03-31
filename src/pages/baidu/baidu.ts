import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.base.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.control.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.core.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.maptype.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.overlay.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.panorama.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.rightmenu.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.service.d.ts" />
/// <reference path="../../../node_modules/@types/baidumap-web-sdk/baidumap.tools.d.ts" />

declare let BMap: any;
declare let BMapLib: any; 

interface Point {
    constructor (lng: number, lat: number)
    lng: number
    lat: number
    equals(other: Point): boolean
}

@IonicPage()
@Component({
    selector: 'page-baidu',
    templateUrl: 'baidu.html',
})
export class BaiduPage {

    public map: any;

    // 创建jsons用来将坐标数组转换为JSON格式便于传输
    jsons = "[";
    
    overlays = new BMap.Polygon(Array<Point>());
    overlaycomplete = (e) => {
        // 判断当前覆盖物的类型是否为圆形
        if (e.overlay.__proto__.xQ == "Circle") {
            console.log(e.overlay);
            this.overlays.oc.push(e.overlay.point["lng"], e.overlay.point["lat"], e.overlay.xa, e.overlay.__proto__.xQ); // 以此存储圆的圆心经度、纬度、半径、类型
        // 否则就为多边形，此时便不用将类型push进数组，只push顶点的经纬度即可
        }else {
            for(let i=0; i<e.overlay.so.length; i++) {
                this.overlays.oc.push(e.overlay.so[i]["lng"], e.overlay.so[i]["lat"]);
            }
        }
        // 选用this.overlays.oc是因为发现不管是圆还是多边形，Overlay的这个属性都为空数组
    };

    constructor(public navCtrl: NavController, public navParams: NavParams) {
    }

    ionViewDidLoad() {
        this.loadMap();
    }

    loadMap() {
        // 实例化地图
        let map = this.map = new BMap.Map("map");
        
        // 获取用户当前位置
        let geolocation = new BMap.Geolocation();
        geolocation.getCurrentPosition((res) => {
            // 获取用户当前位置的经纬度
            let poi = res.point;
            // 将用户当前经纬度放到隐藏的id为shape的HTML中方便以后再用
            document.getElementById("shape").innerHTML += (poi.lng + '|' + poi.lat);
            // 判断如果获取用户位置成功则进行Marker标注并以用户当前位置为中心自动移动缩放地图
            if(geolocation.getStatus() == 0) {
                let point = new BMap.Point(poi.lng, poi.lat);
                let marker = new BMap.Marker(point);
                map.addOverlay(marker);
                map.centerAndZoom(point, 16);
            }else {
                console.log(new Error("fail to get location."));
            }
        })

        // 地图放大缩小控件
        let sizeMap = new BMap.Size(10, 80);    // 显示位置
        map.addControl(new BMap.NavigationControl({
            anchor: BMap.BMAP_ANCHOR_TOP_RIGHT,
            offset: sizeMap
        }))         
    }

    draw(){
        //实例化鼠标绘制工具
        var drawingManager = new BMapLib.DrawingManager(this.map, {
            isOpen: true, //是否开启绘制模式
            enableDrawingTool: true, //是否显示工具栏
            drawingToolOptions: {
                anchor: BMap.BMAP_ANCHOR_TOP_RIGHT, //位置
                offset: new BMap.Size(5, 5), //偏离值
            }
        });  

        //添加鼠标绘制工具监听事件，用于获取绘制结果
        drawingManager.addEventListener('overlaycomplete', this.overlaycomplete);

        drawingManager.open(); 
    }	

    // 获取圆的圆心的坐标及半径（或多边形的顶点坐标）判断当前位置是否在安全区
    getPoint() {
        // 从id为shape的HTML中重用当前用户位置
        let ps = document.getElementById("shape").innerHTML.split('|');
        let pt = new BMap.Point(ps[0], ps[1]);
        // 判断安全区类型是否为圆形   
        if(this.overlays.oc[3] == "Circle") {
            let pointCenter = new BMap.Point(this.overlays.oc[0], this.overlays.oc[1]);
            let circle = new BMap.Circle(pointCenter, this.overlays.oc[2]);
            let result = BMapLib.GeoUtils.isPointInCircle(pt, circle);
            if(result == true){
                alert("安全");
            }else{
                alert("毒区");
            }         
        // 否则就为多边形
        }else {
            // 创建一个空数组用来盛放多边形顶点坐标
            let pts = [];
            // 将多边形的顶点坐标以2为一组进行存储为规矩的经纬度坐标
            for(let i=0; i<this.overlays.oc.length; i+=2) {
                pts.push(this.overlays.oc.slice(i, i+2));
            } 
            // 创建一个空数组用来盛放实例化的顶点坐标Point
            let points = [];
            for(let j=0; j<pts.length; j++) {
                points.push(new BMap.Point(pts[j][0], pts[j][1]));

                // 将多边形顶点坐标添加为一个JSON格式数据
                let aModel = {
                    lng: (pts[j][0]),
                    lat: (pts[j][1])
                }
                let json = JSON.stringify(aModel);
                if(j != (pts.length-1)) {
                    this.jsons += json + ',';
                }else {
                    this.jsons += json + "]";
                }
            }
            // 将一个个顶点坐标Point用来生成Polygon区域
            let ply = new BMap.Polygon(points);
            // 通过比较用户当前位置Point是否在Polygon区域范围内来判断是否在安全区
            let result = BMapLib.GeoUtils.isPointInPolygon(pt, ply);
            if(result == true) {
                alert("安全");
            }else {
                alert("毒区");
            }
        }
    }

    // 清除所有覆盖物
    clearAll() {
        if(this.overlays.oc[3] == "Circle") {
            let aModel = {
                lng: (this.overlays.oc[0]),
                lat: (this.overlays.oc[1])
            }
            let json = JSON.stringify(aModel);
            this.jsons += json + ']';
        }else {

        }
    }

    // 提交所绘制的多边形顶点坐标
    submit() {
        var xhr = new XMLHttpRequest();
        if(xhr.withCredentials === undefined) return;
        xhr.open('POST', 'http://localhost:8100/assets/php/data.php');
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded;charset=UTF-8");  
        xhr.send(JSON.parse(this.jsons));
        xhr.onreadystatechange = function(){
            if(xhr.readyState !== 4) return;
            if(xhr.status === 200){
                alert("success")
            }
        }
    }
}

/*  ==================
// 定义正方形覆盖物的构造函数
function SqureOverlay(center, length, color) {
    this._center = center;
    this._length = length;
    this._color = color;
}
// 继承API的BMap.Overlay
SqureOverlay.prototype = new BMap.Overlay();
// 实现初始化方法
SqureOverlay.prototype.initialize = function(map) {
    // 保存map对象实例
    this._map = map;
    // 创建div元素，作为自定义覆盖物的容器
    var div = document.getElementById("shape");
    div.style.position = "absolute";
    //可以根据参数设置元素外观
    div.style.width = this._length + "px";
    div.style.height = this._length + "px";
    div.style.background = this._color;
    div.style.zIndex = "9999999999999";
    // 将div添加到覆盖物容器中
    map.getPanes().markerPane.appendChild(div);
    // 保存div实例
    this._div = div;
    // 需要将div元素作为方法的返回值，当调用该覆盖物的show、hide方法，或对覆盖物进行移除时
    return div;
}
// 绘制覆盖物
SqureOverlay.prototype.draw = function() {
    // 根据地理坐标转换为像素坐标并设置给容器
    var position = this._map.pointToOverlayPixel(this._center);
    this._div.style.left = position.x + window.innerWidth - this._length /2 + "px";
    this._div.style.top = position.y + window.innerHeight - this._length /2 + "px";
}
==================  */
