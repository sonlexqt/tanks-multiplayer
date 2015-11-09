/**
 * Created by Hieu on 11/8/2015.
 */
var DATA = [
    //[[40, 40], [120, 40], [120, 120], [80, 120], [80, 80], [40, 80]],
    //[[80, 240], [240, 240], [240, 280], [80, 280]],
    //[[160, 400], [200, 400], [200, 440], [320, 440], [320, 480], [160, 480]],
    //[[540, 140], [620, 140], [620, 260], [580, 260], [580, 180], [540, 180]],
    //[[160, 100], [200, 100], [200, 140], [320, 140], [320, 180], [160, 180]],
    //[[380, 340], [640, 340], [640, 380], [380, 380]],

    [[204, 1397], [414, 1397], [414, 1592], [204, 1592]],
    [[465, 1619], [675, 1619], [675, 1820], [465, 1820]],

    [[454, 1155], [657, 1155], [657, 1354], [454, 1354]],
    [[701, 1407], [899, 1407], [899, 1605], [701, 1605]],

    [[200, 612], [576, 612], [576, 803], [200, 803]],
    [[810, 836], [996, 1015], [819, 1204], [630, 1027]],
    [[1052, 1079], [1229, 1252], [1050, 1440], [872, 1271]],
    [[1250, 1459], [1472, 1459], [1472, 1855], [1250, 1855]],

    [[611, 209], [821, 209], [821, 581], [611, 581]],
    [[1054, 612], [1232, 786], [1047, 974], [869, 802]],
    [[1285, 855], [1474, 1032], [1295, 1219], [1107, 1045]],
    [[1454, 1227], [1867, 1227], [1867, 1442], [1454, 1442]],

    [[1152, 456], [1348, 456], [1348, 646], [1152, 646]],
    [[1412, 681], [1619, 681], [1619, 879], [1412, 879]],
    [[1394, 205], [1600, 205], [1605, 418], [1394, 418]],
    [[1636, 462], [1834, 462], [1834, 659], [1636, 659]]

];

var Data = function () {
};
Data.key = 0;
Data.obstacleData = DATA;
Data.vertexData = {};
Data.MAP_DATA = {"width": 2059, "height": 2070, "startx": 0, "starty": 0};
Data.DEBUG = false;
Data.generateObstacle = function () {
    var obstacleList = [];
    for (var obs = 0; obs < Data.obstacleData.length; obs++) {
        var vertexList = Data.generateVertex(Data.obstacleData[obs]);
        var newObstacle = new Obstacle(vertexList);
        obstacleList.push(newObstacle);
    }
    return obstacleList;
};

Data.generateVertex = function (vertList) {
    var vertexList = [];
    for (var vert = 0; vert < vertList.length; vert++) {
        var newVert = new Vertex(vertList[vert][0], vertList[vert][1], Data.key);
        vertexList.push(newVert);
        Data.vertexData[Data.key] = newVert;
        Data.key++;
    }
    return vertexList;
};
