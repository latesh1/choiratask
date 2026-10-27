const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Choira MusicTech — Project & Task Management API',
    version: '1.0.0',
    description:
      'Production-conscious REST API for managing users, audio projects, and task workflows for Choira MusicTech.\n\n' +
      'Features a hybrid database architecture with **MySQL** for ACID-critical users and projects, and **MongoDB (Mongoose)** for dynamic task documents.\n\n' +
      '### How to Authenticate:\n' +
      '1. Use `POST /api/auth/register` or `POST /api/auth/login` to obtain a JWT token.\n' +
      '2. Click the **Authorize 🔓** button in the top right.\n' +
      '3. Enter your token in the Value field (format: `your_token_here` or `Bearer your_token_here`).\n' +
      '4. Click **Authorize** and then **Close**.\n' +
      '5. All protected endpoints will now include the Bearer token in requests.',
    contact: {
      name: 'Choira MusicTech Developer Support',
      email: 'support@choiramusic.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Local Development Server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User registration, login, and profile operations' },
    { name: 'Projects', description: 'MySQL project management and ownership enforcement' },
    { name: 'Tasks', description: 'MongoDB task management, filtering, and pagination' },
    { name: 'Dashboard', description: 'Aggregated metrics from MySQL and MongoDB' },
    { name: 'System', description: 'Service health check' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid JWT token. Example: "Bearer eyJhbGciOi..."'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Latesh Billava' },
          email: { type: 'string', format: 'email', example: 'latesh.billava11@gmail.com' },
          created_at: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Latesh Billava' },
          email: { type: 'string', format: 'email', example: 'latesh.billava11@gmail.com' },
          password: { type: 'string', minLength: 6, maxLength: 128, example: 'MusicProd#2026' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'latesh.billava11@gmail.com' },
          password: { type: 'string', example: 'MusicProd#2026' }
        }
      },
      ProfileUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Latesh Billava - Senior Sound Engineer' },
          email: { type: 'string', format: 'email', example: 'latesh.updated@gmail.com' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Spatial Audio Reverb VST' },
          description: { type: 'string', nullable: true, example: 'Convolution reverb DSP engine with 3D ambisonics' },
          status: { type: 'string', enum: ['active', 'completed', 'archived'], example: 'active' },
          created_at: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-10-27T10:00:00.000Z' }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255, example: 'Spatial Audio Reverb VST' },
          description: { type: 'string', nullable: true, example: 'Convolution reverb DSP engine with 3D ambisonics' },
          status: { type: 'string', enum: ['active', 'completed', 'archived'], default: 'active', example: 'active' }
        }
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255, example: 'Spatial Audio Reverb VST v2' },
          description: { type: 'string', nullable: true, example: 'Updated DSP algorithm' },
          status: { type: 'string', enum: ['active', 'completed', 'archived'], example: 'completed' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '671e0f31c26f63412cbdf321' },
          title: { type: 'string', example: 'Implement Low-Pass Biquad Filter' },
          description: { type: 'string', example: 'Implement second-order IIR Butterworth filter in C++' },
          projectId: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['todo', 'in_progress', 'completed'], example: 'todo' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
          dueDate: { type: 'string', format: 'date-time', nullable: true, example: '2026-12-31T23:59:59.000Z' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-27T10:05:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-27T10:05:00.000Z' }
        }
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['title', 'projectId'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200, example: 'Implement Low-Pass Biquad Filter' },
          description: { type: 'string', example: 'Implement second-order IIR Butterworth filter in C++' },
          projectId: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['todo', 'in_progress', 'completed'], default: 'todo', example: 'todo' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', example: 'high' },
          dueDate: { type: 'string', format: 'date-time', nullable: true, example: '2026-12-31T23:59:59.000Z' }
        }
      },
      UpdateTaskRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200, example: 'Optimized Butterworth Filter' },
          description: { type: 'string', example: 'Vectorized with AVX-512' },
          projectId: { type: 'integer', example: 1 },
          status: { type: 'string', enum: ['todo', 'in_progress', 'completed'], example: 'in_progress' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
          dueDate: { type: 'string', format: 'date-time', nullable: true, example: '2026-12-31T23:59:59.000Z' }
        }
      },
      DashboardStatistics: {
        type: 'object',
        properties: {
          totalProjects: { type: 'integer', example: 3, description: 'All projects owned by the user' },
          activeProjects: { type: 'integer', example: 2, description: 'Projects with status active' },
          completedProjects: { type: 'integer', example: 1, description: 'Projects with status completed' },
          totalTasks: { type: 'integer', example: 12, description: 'All tasks owned by the user' },
          pendingTasks: { type: 'integer', example: 8, description: 'Tasks with status todo or in_progress' },
          completedTasks: { type: 'integer', example: 4, description: 'Tasks with status completed' },
          highPriorityTasks: { type: 'integer', example: 5, description: 'All tasks with priority high regardless of status' }
        }
      },
      PaginationMetadata: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalRecords: { type: 'integer', example: 25 },
          totalPages: { type: 'integer', example: 3 }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'email' },
          message: { type: 'string', example: 'Please provide a valid email address' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', nullable: true }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'An error occurred' },
          errors: {
            type: 'array',
            items: { $ref: '#/components/schemas/ValidationError' }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Service health check',
        description: 'Verify server status, timestamp, and environment.',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Service is healthy' },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'UP' },
                        timestamp: { type: 'string', format: 'date-time' },
                        environment: { type: 'string', example: 'development' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Creates a new user record with bcrypt-hashed password in MySQL and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    }
                  }
                }
              }
            }
          },
          409: {
            description: 'Duplicate email conflict',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  message: 'An account with this email already exists',
                  errors: []
                }
              }
            }
          },
          422: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        description: 'Authenticates credentials against MySQL and returns a JWT token. Uses generic failure message on invalid credentials.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  message: 'Invalid email or password',
                  errors: []
                }
              }
            }
          },
          422: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Returns the profile of the authenticated user identified by the verified JWT token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/profile': {
      put: {
        tags: ['Authentication'],
        summary: 'Update user profile',
        description: 'Updates permitted profile fields (name, email) for the authenticated user only.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProfileUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile updated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Email already in use by another account',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          422: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        description: 'Creates a project belonging to the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
            }
          },
          422: {
            description: 'Validation failed',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
            }
          }
        }
      },
      get: {
        tags: ['Projects'],
        summary: 'List user projects',
        description: 'Returns all projects owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Projects retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Projects retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        projects: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Project' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } }
            }
          }
        }
      }
    },
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        description: 'Retrieves a single project owned by the authenticated user. Returns 404 if project does not exist or belongs to another user.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Project integer ID',
            schema: { type: 'integer', minimum: 1, example: 1 }
          }
        ],
        responses: {
          200: {
            description: 'Project retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Invalid project ID parameter',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        tags: ['Projects'],
        summary: 'Update project by ID',
        description: 'Updates an existing project owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Project integer ID',
            schema: { type: 'integer', minimum: 1, example: 1 }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Project updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project updated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        project: { $ref: '#/components/schemas/Project' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Validation failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project by ID',
        description: 'Deletes a project owned by the user. Implements cascading task cleanup: explicitly removes all associated tasks in MongoDB, then deletes the MySQL project record.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Project integer ID',
            schema: { type: 'integer', minimum: 1, example: 1 }
          }
        ],
        responses: {
          200: {
            description: 'Project deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project deleted successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        deletedTasksCount: { type: 'integer', example: 3 }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Invalid project ID',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        description: 'Creates a task stored in MongoDB. Verifies that the referenced MySQL project exists and belongs to the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Referenced project does not exist or is not owned by user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Validation failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      get: {
        tags: ['Tasks'],
        summary: 'List tasks with filtering and pagination',
        description: 'Retrieves paginated tasks owned by the authenticated user with optional filtering by status, priority, and projectId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (minimum 1)',
            schema: { type: 'integer', default: 1, minimum: 1, example: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Records per page (maximum 100)',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100, example: 10 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by task status',
            schema: { type: 'string', enum: ['todo', 'in_progress', 'completed'], example: 'todo' }
          },
          {
            name: 'priority',
            in: 'query',
            description: 'Filter by task priority',
            schema: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' }
          },
          {
            name: 'projectId',
            in: 'query',
            description: 'Filter by MySQL project ID',
            schema: { type: 'integer', minimum: 1, example: 1 }
          }
        ],
        responses: {
          200: {
            description: 'Tasks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Tasks retrieved successfully' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' }
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMetadata' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Invalid or unsupported query parameters',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        description: 'Retrieves a single task owned by the authenticated user using its 24-character hexadecimal MongoDB ObjectId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: '24-character hexadecimal MongoDB ObjectId',
            schema: { type: 'string', example: '671e0f31c26f63412cbdf321' }
          }
        ],
        responses: {
          200: {
            description: 'Task retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Task not found or owned by another user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Invalid MongoDB ObjectId format',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update task by ID',
        description: 'Updates writable fields for a task. If projectId is changed, verifies ownership of the new project.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: '24-character hexadecimal MongoDB ObjectId',
            schema: { type: 'string', example: '671e0f31c26f63412cbdf321' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTaskRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task updated successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        task: { $ref: '#/components/schemas/Task' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Task or reassigned project not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Validation failed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task by ID',
        description: 'Deletes a task owned by the authenticated user.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: '24-character hexadecimal MongoDB ObjectId',
            schema: { type: 'string', example: '671e0f31c26f63412cbdf321' }
          }
        ],
        responses: {
          200: {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task deleted successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '671e0f31c26f63412cbdf321' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: {
            description: 'Task not found or owned by another user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          422: {
            description: 'Invalid MongoDB ObjectId format',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        description: 'Returns aggregated project metrics from MySQL and task metrics from MongoDB scoped to the authenticated user.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Dashboard statistics retrieved successfully' },
                    data: { $ref: '#/components/schemas/DashboardStatistics' }
                  }
                }
              }
            }
          },
          401: {
            description: 'Authentication required',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    }
  }
};

const swaggerOptions = {
  swaggerDefinition,
  apis: []
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
