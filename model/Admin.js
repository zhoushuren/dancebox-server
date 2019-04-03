
const sequelize = require('../config')
const Sequelize = require('sequelize')

const admin = sequelize.define('admin', {
    user_name: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING,
        validate:{
            isEmail: true,
        }
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    algorithm: {
        type: Sequelize.STRING
    },
    salt: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER
    }
},{
    tableName: 'admin',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    getterMethods: {
    }
})


module.exports = admin