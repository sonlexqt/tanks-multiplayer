/**
 * Created by Hieu on 11/8/2015.
 */
var DATA = [
    [[40, 40], [120, 40], [120, 120], [80, 120], [80, 80], [40, 80]],
    [[80, 240], [240, 240], [240, 280], [80, 280]],
    [[160, 400], [200, 400], [200, 440], [320, 440], [320, 480], [160, 480]],
    [[540, 140], [620, 140], [620, 260], [580, 260], [580, 180], [540, 180]],
    [[160, 100], [200, 100], [200, 140], [320, 140], [320, 180], [160, 180]],
    [[380, 340], [640, 340], [640, 380], [380, 380]],
];

var Data = function () {
};
Data.key = 0;
Data.obstacleData = DATA;
Data.vertexData = {};
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
