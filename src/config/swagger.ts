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
        url: process.env.SWAGGER_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
      ...(process.env.SWAGGER_ADDITIONAL_SERVERS 
        ? process.env.SWAGGER_ADDITIONAL_SERVERS.split(',').map((url: string) => ({
            url: url.trim(),
            description: 'Additional server',
          }))
        : [
            {
              url: 'http://localhost:8081',
              description: 'Mobile development server',
            },
          ]
      ),
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
            minAge: {
              type: 'number',
              description: 'Minimum yaş',
            },
            maxAge: {
              type: 'number',
              description: 'Maximum yaş',
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
            settings: {
              $ref: '#/components/schemas/LeagueSettings',
              description: 'Lig ayarları',
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
        LeagueSettingsSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Şablon ID',
            },
            description: {
              type: 'string',
              description: 'Şablon açıklaması',
            },
            leagueStartDate: {
              type: 'string',
              format: 'date',
              description: 'Lig başlangıç tarihi',
            },
            leagueEndDate: {
              type: 'string',
              format: 'date',
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
            minAge: {
              type: 'number',
              description: 'Minimum yaş sınırı',
            },
            maxAge: {
              type: 'number',
              description: 'Maksimum yaş sınırı',
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

