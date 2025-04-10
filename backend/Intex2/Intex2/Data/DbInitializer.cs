using System;
using System.IO;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Identity;

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
                var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
                
                // Ensure the database is created and migrations are applied
                context.Database.EnsureCreated();
                
                // Create Identity tables if they don't exist
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
                
                // Create roles if they don't exist
                if (!roleManager.RoleExistsAsync("Administrator").Result)
                {
                    roleManager.CreateAsync(new IdentityRole("Administrator")).Wait();
                }
                if (!roleManager.RoleExistsAsync("User").Result)
                {
                    roleManager.CreateAsync(new IdentityRole("User")).Wait();
                }
                
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