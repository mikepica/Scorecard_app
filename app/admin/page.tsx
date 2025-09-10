"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PillarsEditor,
  CategoriesEditor,
  GoalsEditor,
  ProgramsEditor,
  FunctionalProgramsEditor,
  ProgressUpdateHistoryViewer
} from '@/components/admin/table-editors';
import { 
  Database,
  BarChart3,
  Target,
  Layers,
  Building2,
  History,
  AlertTriangle,
  Home,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('pillars');

  const handleExportAll = async () => {
    const tables = [
      { name: 'strategic_pillars', endpoint: '/api/admin/pillars' },
      { name: 'categories', endpoint: '/api/admin/categories' },
      { name: 'strategic_goals', endpoint: '/api/admin/goals' },
      { name: 'strategic_programs', endpoint: '/api/admin/programs' },
      { name: 'functional_programs', endpoint: '/api/admin/functional-programs' }
    ];

    try {
      const exportData: Record<string, unknown[]> = {};
      
      for (const table of tables) {
        const response = await fetch(`${table.endpoint}?page=1&limit=10000`);
        if (response.ok) {
          const result: { data: unknown[] } = await response.json();
          exportData[table.name] = result.data;
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scorecard-complete-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Complete database export completed successfully');
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast.error('Failed to export data');
    }
  };

  const tabsConfig = [
    {
      value: 'pillars',
      label: 'Pillars',
      icon: <Building2 className="w-4 h-4" />,
      component: <PillarsEditor />,
      description: 'Manage strategic pillars - the top-level organizational structure'
    },
    {
      value: 'categories',
      label: 'Categories',
      icon: <Layers className="w-4 h-4" />,
      component: <CategoriesEditor />,
      description: 'Manage categories within each pillar'
    },
    {
      value: 'goals',
      label: 'Goals',
      icon: <Target className="w-4 h-4" />,
      component: <GoalsEditor />,
      description: 'Manage strategic goals within categories'
    },
    {
      value: 'programs',
      label: 'Strategic Programs',
      icon: <BarChart3 className="w-4 h-4" />,
      component: <ProgramsEditor />,
      description: 'Manage strategic programs within goals'
    },
    {
      value: 'functional',
      label: 'Functional Programs',
      icon: <Database className="w-4 h-4" />,
      component: <FunctionalProgramsEditor />,
      description: 'Manage functional programs and their objectives'
    },
    {
      value: 'history',
      label: 'Progress History',
      icon: <History className="w-4 h-4" />,
      component: <ProgressUpdateHistoryViewer />,
      description: 'View audit trail of progress update changes'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="w-8 h-8" />
              Scorecard Admin
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all scorecard data, add new records, and monitor changes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="w-4 h-4" />
                Back to Scorecard
              </Link>
            </Button>
            <Button onClick={handleExportAll} variant="outline">
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Strategic Pillars</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Layers className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Strategic Goals</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Programs</p>
                  <p className="text-2xl font-bold">180</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-orange-800">Admin Interface Warning</h3>
                <p className="text-sm text-orange-700 mt-1">
                  This interface provides direct access to modify all scorecard data. 
                  Changes are immediately saved and will affect the live scorecard. 
                  Use caution when editing or deleting records, especially those with dependencies.
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Real-time updates
                  </Badge>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Cascade deletes
                  </Badge>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Audit logged
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {tabsConfig.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsConfig.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </CardTitle>
                <CardDescription>
                  {tab.description}
                </CardDescription>
              </CardHeader>
            </Card>
            
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
        <p>
          Scorecard Admin Interface • All changes are automatically saved and logged • 
          <Link href="/instructions" className="text-blue-500 hover:underline ml-1">
            View Instructions
          </Link>
        </p>
      </div>
    </div>
  );
}