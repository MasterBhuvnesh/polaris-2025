'use client'

import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { databases, client } from '@/lib/appwrite-server'
import { Query, Models } from 'appwrite'

interface TeamData {
  teamName: string
  totalPoints: number
  round1Points: number
  round2Points: number
  round3Points: number
  round4Points: number
}

export default function Leaderboard() {
  const [viewMode, setViewMode] = useState<'total' | 'rounds'>('total')
  const [teams, setTeams] = useState<TeamData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DB!,
          process.env.NEXT_PUBLIC_APPWRITE_USERS!,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(100)
          ]
        )
        setTeams(response.documents.map(mapDocumentToTeamData))
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to fetch initial data. Please check your database configuration.')
      }
    }

    fetchUsers()
    //@ts-ignore
    const unsubscribe = client.subscribe(`databases.${process.env.NEXT_APPWRITE_DB!}.collections.users.documents`, (response) => {
      const { events, payload } = response

      if (events.includes('databases.documents.update')) {
        setTeams(prevTeams => {
          //@ts-ignore
          const updatedTeam = mapDocumentToTeamData(payload)
          return prevTeams.map(team => 
            team.teamName === updatedTeam.teamName ? updatedTeam : team
          )
        })
      } else if (events.includes('databases.documents.create')) {
        //@ts-ignore
        setTeams(prevTeams => [...prevTeams, mapDocumentToTeamData(payload)])
      } else if (events.includes('databases.documents.delete')) {
        //@ts-ignore
        setTeams(prevTeams => prevTeams.filter(team => team.teamName !== payload.name))
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const mapDocumentToTeamData = (doc: Models.Document): TeamData => ({
    teamName: doc.name,
    totalPoints: doc.round_1 + doc.round_2 + doc.round_3 + doc.round_4,
    round1Points: doc.round_1,
    round2Points: doc.round_2,
    round3Points: doc.round_3,
    round4Points: doc.round_4,
  })

  const sortedData = [...teams].sort((a, b) => {
    if (viewMode === 'total') {
      return b.totalPoints - a.totalPoints
    } else {
      return (
        b.round1Points +
        b.round2Points +
        b.round3Points +
        b.round4Points -
        (a.round1Points + a.round2Points + a.round3Points + a.round4Points)
      )
    }
  })

  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-400" />
      case 1:
        return <Medal className="text-gray-400" />
      case 2:
        return <Award className="text-amber-600" />
      default:
        return null
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">Game Leaderboard</h1>
      <div className="flex justify-center mb-6">
        <Button
          onClick={() => setViewMode('total')}
          variant={viewMode === 'total' ? 'default' : 'outline'}
          className="mr-2"
        >
          Total Points
        </Button>
        <Button
          onClick={() => setViewMode('rounds')}
          variant={viewMode === 'rounds' ? 'default' : 'outline'}
        >
          Round-wise
        </Button>
      </div>
      <div className="bg-background shadow-xl rounded-lg overflow-hidden border-4 border-primary">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Team Name</TableHead>
              {viewMode === 'total' ? (
                <TableHead className="text-right">Total Points</TableHead>
              ) : (
                <>
                  <TableHead className="text-right">Round 1</TableHead>
                  <TableHead className="text-right">Round 2</TableHead>
                  <TableHead className="text-right">Round 3</TableHead>
                  <TableHead className="text-right">Round 4</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((team, index) => (
              <TableRow key={team.teamName+`${index}`} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {getPositionIcon(index)}
                    <span className="ml-2">{index + 1}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">{team.teamName}</TableCell>
                {viewMode === 'total' ? (
                  <TableCell className="text-right font-semibold">{team.totalPoints}</TableCell>
                ) : (
                  <>
                    <TableCell className="text-right">{team.round1Points}</TableCell>
                    <TableCell className="text-right">{team.round2Points}</TableCell>
                    <TableCell className="text-right">{team.round3Points}</TableCell>
                    <TableCell className="text-right">{team.round4Points}</TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
