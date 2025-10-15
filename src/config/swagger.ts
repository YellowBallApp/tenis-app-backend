import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tenis App Backend API',
      version: '1.0.0',
      description: 'Tenis uygulaması için RESTful API dokümantasyonu',
      contact: {
        name: 'API Desteği',
        email: 'support@tenisapp.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:8081',
        description: 'Mobile development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Kullanıcı ID (UUID)',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Kullanıcı email adresi',
            },
            name: {
              type: 'string',
              description: 'Kullanıcı adı',
            },
            surname: {
              type: 'string',
              description: 'Kullanıcı soyadı',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Kullanıcı cinsiyeti',
            },
            phone: {
              type: 'string',
              description: 'Telefon numarası',
            },
            title: {
              type: 'string',
              description: 'Kullanıcı rolü/başlığı',
            },
          },
        },
        LeagueSettings: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Lig kodu',
            },
            description: {
              type: 'string',
              description: 'Lig açıklaması',
            },
            leagueStartDate: {
              type: 'string',
              format: 'date-time',
              description: 'Lig başlangıç tarihi',
            },
            leagueEndDate: {
              type: 'string',
              format: 'date-time',
              description: 'Lig bitiş tarihi',
            },
            registrationFee: {
              type: 'number',
              description: 'Kayıt ücreti',
            },
            minMatchCountForElimination: {
              type: 'number',
              description: 'Eleme için minimum maç sayısı',
            },
          },
        },
        League: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Lig ID',
            },
            description: {
              type: 'string',
              description: 'Lig açıklaması',
            },
            leagueSettingsTemplates: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LeagueSettingsTemplate',
              },
              description: 'Lig ayar şablonları',
            },
          },
        },
        LeagueStandings: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Sıralama ID',
            },
            description: {
              type: 'string',
              description: 'Sıralama açıklaması',
            },
            leagueRanking: {
              type: 'number',
              description: 'Lig sıralaması (pozisyon)',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        LeagueSettingsTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Şablon ID',
            },
            code: {
              type: 'string',
              description: 'Şablon kodu',
            },
            description: {
              type: 'string',
              description: 'Şablon açıklaması',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Hata mesajı',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Başarı mesajı',
            },
            data: {
              type: 'object',
              description: 'Dönüş verisi',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Route dosyalarının yolu
};

export const swaggerSpec = swaggerJsdoc(options);

