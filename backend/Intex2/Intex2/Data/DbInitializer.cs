using System;
using System.IO;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Intex2.Models;

public static class DbInitializer
{
    public static IHost InitializeDatabase(this IHost host)
    {
        using (var scope = host.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var context = services.GetRequiredService<MoviesDBContext>();
                context.Database.EnsureCreated();
                
                // Now execute our custom SQL to create Identity tables
                var connection = (SqliteConnection)context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    connection.Open();
                }

                // Read the SQL script
                string sqlScript = File.ReadAllText("Data/CreateIdentityTables.sql");
                
                // Create a command and execute it
                using var command = connection.CreateCommand();
                command.CommandText = sqlScript;
                command.ExecuteNonQuery();
                
                Console.WriteLine("Database initialization complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine("An error occurred while initializing the database: " + ex.Message);
                if (ex.InnerException != null)
                {
                    Console.WriteLine("Inner exception: " + ex.InnerException.Message);
                }
                Console.WriteLine(ex.StackTrace);
            }
        }
        
        return host;
    }
} 