/**
 * Created by Hieu on 11/8/2015.
 */
var MAP_DATA = {"width": 2059, "height": 2070, "startx": 0, "starty": 0};
var DATA = [
    //[[40, 40], [120, 40], [120, 120], [80, 120], [80, 80], [40, 80]],
    //[[80, 240], [240, 240], [240, 280], [80, 280]],
    //[[160, 400], [200, 400], [200, 440], [320, 440], [320, 480], [160, 480]],
    //[[540, 140], [620, 140], [620, 260], [580, 260], [580, 180], [540, 180]],
    //[[160, 100], [200, 100], [200, 140], [320, 140], [320, 180], [160, 180]],
    //[[380, 340], [640, 340], [640, 380], [380, 380]],
    //
    //[[0, 0], [MAP_DATA.width, 0], [MAP_DATA.width, 162], [0, 162]],
    //[[1917, 0], [MAP_DATA.width, 0], [MAP_DATA.width, MAP_DATA.height], [1917, MAP_DATA.height]],
    //[[0, 1930], [MAP_DATA.width, 1930], [MAP_DATA.width, MAP_DATA.height], [0, MAP_DATA.height]],
    //[[0, 0], [154, 0], [154, MAP_DATA.height], [0, MAP_DATA.height]],
    [[538, 1596], [826, 1595], [827, 1983], [537, 1984]],
    [[1284, 1584], [1566, 1584], [1565, 1985], [1284, 1985]],

    [[291, 1132], [545, 1134], [665, 1266], [657, 1516], [205, 1531], [205, 1267]],
    [[1562, 1142], [1804, 1143], [1886, 1289], [1886, 1516], [1447, 1515], [1451, 1251]],

    [[74, 881], [287, 880], [284, 1113], [72, 1112]],
    [[523, 883], [776, 883], [776, 1121], [525, 1123]],
    [[809, 750], [999, 751], [999, 1250], [808, 1250]],
    [[1101, 753], [1277, 751], [1277, 1248], [1099, 1255]],
    [[1340, 888], [1566, 889], [1567, 1108], [1340, 1110]],
    [[1780, 877], [1998, 874], [1999, 1113], [1779, 1113]],

    [[198, 517], [633, 519], [635, 764], [517, 862], [284, 861], [199, 766]],
    [[1424, 526], [1879, 527], [1879, 749], [1794, 862], [1545, 861], [1424, 747]],

    [[548, 65], [806, 67], [805, 462], [548, 464]],
    [[1293, 70], [1546, 70], [1547, 462], [1291, 461]]
];
var Data = function () {
};
Data.key = 0;
Data.obstacleData = DATA;
Data.vertexData = {};
Data.MAP_DATA = {"width": 2059, "height": 2070, "startx": 0, "starty": 0};
Data.DEBUG = false;
Data.tank_velocity = 240;
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
