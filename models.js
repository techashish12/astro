'use strict';
module.exports = function(config) {
    const Sequelize = require('sequelize');
    const bcrypt = require('bcrypt');
    const dbConfig = config.db.dev;

    const sql = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });

    const User = sql.define('user', {
        id: { 
            type: Sequelize.BIGINT, 
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            validate: {
                isEmail: true
            },
            allowNull:false,
            unique: true
        },
        password: {
            type: Sequelize.STRING,
            validate: {
                min: 6
            },
            allowNull:false
        }
    }, {
        version: true,
        paranoid: true,
        timestamps: true,
        hooks: {
            beforeCreate: function(user, options) {
                user.password = user.generateHash(user.password)
            },
        }
    });

    User.prototype.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
    };
    User.prototype.validPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    };
    User.prototype.toJSON = function() {
        return {
            id: this.id,
            email: this.email
        }
    };

    const NatalDate = sql.define('natalDate', {
        id: { 
            type: Sequelize.BIGINT, 
            allowNull: false,
            primaryKey: true,
            unique: 'compositeIndex'
        },
        userId: {
            type: Sequelize.BIGINT,
            allowNull: false,
            primaryKey: true,
            unique: 'compositeIndex'
        },
        name: { 
            type: Sequelize.STRING, 
            allowNull: false,
        },
        date: { 
            type: Sequelize.DATE,
            allowNull: false
        },
        location: {
            type: Sequelize.STRING,
            allowNull: false
        },
        timezoneMinutesDifference: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        type: {
            type:   Sequelize.ENUM,
            values: ['male', 'female', 'freeSpirit', 'unknown'],
            defaultValue: 'unknown'
        },
        primary: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        version: true,
        paranoid: true,
        timestamps: true,
        hooks: {
            beforeCreate: function(natalDate, options) {
                return NatalDate.max('id', { where: { userId: natalDate.userId } })
                .then(max => {
                    natalDate.id = (Number.isNaN(max) ? 1 : max + 1);
                })
            },
        }
    });

    User.hasMany(NatalDate, {foreignKey: 'userId', sourceKey: 'id'});
    NatalDate.belongsTo(User, {foreignKey: 'userId', targetKey: 'id'});

    const Explanation = sql.define('explanation', {
        type: {
            type:   Sequelize.ENUM,
            values: ['daily', 'monthly', 'yearly'],
            allowNull: false,
            unique: 'compositeIndex'
        },
        variation: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: 'compositeIndex'
        },
        inneerPlanet: {
            type:   Sequelize.ENUM,
            values: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter'],
            allowNull: false,
            unique: 'compositeIndex'
        },
        outerPlanet: {
            type:   Sequelize.ENUM,
            values: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter'],
            allowNull: false,
            unique: 'compositeIndex'
        },
        aspect: {
            type:   Sequelize.ENUM,
            values: ['sun', 'moon', 'venus', 'mars'],
            allowNull: false,
            unique: 'compositeIndex'
        },
        lemma: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        version: true,
        paranoid: true,
        timestamps: true
    });

    const DailyPrediction = sql.define('dailyPrediction', {
        id: { 
            type: Sequelize.BIGINT, 
            allowNull: false,
            primaryKey: true,
            unique: 'compositeIndex'
        },
        natalDateId: {
            type: Sequelize.BIGINT,
            allowNull: false,
            unique: 'compositeIndex',
        },
        date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        timezone: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        views: {
            type: Sequelize.BIGINT,
            allowNull: false,
            defaultValue: 1
        },
        accurate: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        version: true,
        paranoid: true,
        timestamps: true
    });

    NatalDate.hasMany(DailyPrediction, {foreignKey: 'natalDateId', sourceKey: 'id'});
    DailyPrediction.belongsTo(NatalDate, {foreignKey: 'natalDateId', targetKey: 'id'});

    return {
        sequelize: sql,
        User: User,
        NatalDate: NatalDate,
        Explanation: Explanation,
        DailyPrediction: DailyPrediction,
    }
}