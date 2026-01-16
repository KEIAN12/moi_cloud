"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, BookOpen, FileText, Save, Edit, Trash2, X, Lightbulb, Check, XCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface GlossaryTerm {
    id: string
    ja_term: string
    fr_term: string
    note: string | null
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<"glossary" | "templates" | "users" | "recommendations">("glossary")
    const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newJaTerm, setNewJaTerm] = useState("")
    const [newFrTerm, setNewFrTerm] = useState("")
    const [newNote, setNewNote] = useState("")
    const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
    const [editJaTerm, setEditJaTerm] = useState("")
    const [editFrTerm, setEditFrTerm] = useState("")
    const [editNote, setEditNote] = useState("")
    const [recommendations, setRecommendations] = useState<any[]>([])
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)

    useEffect(() => {
        loadGlossary()
        if (activeTab === "recommendations") {
            loadRecommendations()
        }
    }, [activeTab])

    const loadGlossary = async () => {
        try {
            const res = await fetch("/api/glossary")
            if (res.ok) {
                const data = await res.json()
                setGlossaryTerms(data.terms || [])
            }
        } catch (error) {
            console.error("Error loading glossary:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddGlossaryTerm = async () => {
        if (!newJaTerm.trim() || !newFrTerm.trim()) return

        try {
            const res = await fetch("/api/glossary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ja_term: newJaTerm,
                    fr_term: newFrTerm,
                    note: newNote || null,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setGlossaryTerms([...glossaryTerms, data.term])
                setNewJaTerm("")
                setNewFrTerm("")
                setNewNote("")
            }
        } catch (error) {
            console.error("Error adding glossary term:", error)
        }
    }

    const handleEditGlossaryTerm = (term: GlossaryTerm) => {
        setEditingTerm(term)
        setEditJaTerm(term.ja_term)
        setEditFrTerm(term.fr_term)
        setEditNote(term.note || "")
    }

    const handleUpdateGlossaryTerm = async () => {
        if (!editingTerm || !editJaTerm.trim() || !editFrTerm.trim()) return

        try {
            const res = await fetch(`/api/glossary/${editingTerm.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ja_term: editJaTerm,
                    fr_term: editFrTerm,
                    note: editNote || null,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setGlossaryTerms(glossaryTerms.map(t => t.id === editingTerm.id ? data.term : t))
                setEditingTerm(null)
                setEditJaTerm("")
                setEditFrTerm("")
                setEditNote("")
            }
        } catch (error) {
            console.error("Error updating glossary term:", error)
        }
    }

    const handleDeleteGlossaryTerm = async (termId: string) => {
        if (!confirm("この用語を削除しますか？")) return

        try {
            const res = await fetch(`/api/glossary/${termId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                setGlossaryTerms(glossaryTerms.filter(t => t.id !== termId))
            }
        } catch (error) {
            console.error("Error deleting glossary term:", error)
        }
    }

    const loadRecommendations = async () => {
        setIsLoadingRecommendations(true)
        try {
            const res = await fetch("/api/recommendations?status=proposed")
            if (res.ok) {
                const data = await res.json()
                setRecommendations(data.recommendations || [])
            }
        } catch (error) {
            console.error("Error loading recommendations:", error)
        } finally {
            setIsLoadingRecommendations(false)
        }
    }

    const handleGenerateRecommendations = async () => {
        setIsLoadingRecommendations(true)
        try {
            const res = await fetch("/api/recommendations/generate", {
                method: "POST",
            })
            if (res.ok) {
                const data = await res.json()
                alert(`${data.generated}件の提案を生成しました`)
                loadRecommendations()
            }
        } catch (error) {
            console.error("Error generating recommendations:", error)
            alert("提案の生成に失敗しました")
        } finally {
            setIsLoadingRecommendations(false)
        }
    }

    const handleApproveRecommendation = async (id: string) => {
        if (!confirm("この提案を承認して適用しますか？")) return

        try {
            const res = await fetch(`/api/recommendations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "approved",
                    decided_by: "00000000-0000-0000-0000-000000000001", // TODO: Get from session
                }),
            })

            if (res.ok) {
                alert("提案を承認しました")
                loadRecommendations()
            }
        } catch (error) {
            console.error("Error approving recommendation:", error)
            alert("承認に失敗しました")
        }
    }

    const handleRejectRecommendation = async (id: string) => {
        if (!confirm("この提案を却下しますか？")) return

        try {
            const res = await fetch(`/api/recommendations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "rejected",
                    decided_by: "00000000-0000-0000-0000-000000000001", // TODO: Get from session
                }),
            })

            if (res.ok) {
                loadRecommendations()
            }
        } catch (error) {
            console.error("Error rejecting recommendation:", error)
            alert("却下に失敗しました")
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">設定</h1>
                    <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
                        システム設定と管理
                    </p>
                </div>

                {/* Settings Tabs */}
                <div className="space-y-4">
                    <div className="flex rounded-lg border p-1 bg-muted/50 w-full">
                        <Button
                            variant={activeTab === "glossary" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("glossary")}
                            className="flex-1 h-10 text-sm sm:text-base"
                        >
                            <BookOpen className="mr-2 h-4 w-4" />
                            用語集
                        </Button>
                        <Button
                            variant={activeTab === "templates" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("templates")}
                            className="flex-1 h-10 text-sm sm:text-base"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            テンプレート
                        </Button>
                        <Button
                            variant={activeTab === "users" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("users")}
                            className="flex-1 h-10 text-sm sm:text-base"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            ユーザー
                        </Button>
                        <Button
                            variant={activeTab === "recommendations" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("recommendations")}
                            className="flex-1 h-10 text-sm sm:text-base"
                        >
                            <Lightbulb className="mr-2 h-4 w-4" />
                            提案
                        </Button>
                    </div>

                    {/* Glossary Tab */}
                    {activeTab === "glossary" && (
                        <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl text-balance">用語集管理</CardTitle>
                                <CardDescription className="text-sm sm:text-base text-pretty">
                                    日本語とフランス語の用語対応を管理します
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add New Term */}
                                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                    <h3 className="text-base sm:text-lg font-semibold text-balance">新しい用語を追加</h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="ja-term" className="text-base sm:text-sm">日本語</Label>
                                            <Input
                                                id="ja-term"
                                                placeholder="日本語の用語"
                                                value={newJaTerm}
                                                onChange={(e) => setNewJaTerm(e.target.value)}
                                                className="h-12 sm:h-10 text-base sm:text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fr-term" className="text-base sm:text-sm">フランス語</Label>
                                            <Input
                                                id="fr-term"
                                                placeholder="フランス語の用語"
                                                value={newFrTerm}
                                                onChange={(e) => setNewFrTerm(e.target.value)}
                                                className="h-12 sm:h-10 text-base sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="note" className="text-base sm:text-sm">備考（任意）</Label>
                                        <Input
                                            id="note"
                                            placeholder="備考を入力..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="h-12 sm:h-10 text-base sm:text-sm"
                                        />
                                    </div>
                                    <Button onClick={handleAddGlossaryTerm} className="w-full h-12 sm:h-10 text-base sm:text-sm">
                                        <Save className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                                        追加
                                    </Button>
                                </div>

                                {/* Terms List */}
                                <div className="space-y-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-balance">登録済み用語</h3>
                                    {isLoading ? (
                                        <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">読み込み中...</div>
                                    ) : glossaryTerms.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p className="text-base sm:text-sm text-pretty">用語が登録されていません</p>
                                        </div>
                                    ) : editingTerm ? (
                                        // Edit Mode
                                        <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-base sm:text-lg font-semibold text-balance">用語を編集</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingTerm(null)
                                                        setEditJaTerm("")
                                                        setEditFrTerm("")
                                                        setEditNote("")
                                                    }}
                                                    className="h-8 w-8"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-base sm:text-sm">日本語</Label>
                                                    <Input
                                                        value={editJaTerm}
                                                        onChange={(e) => setEditJaTerm(e.target.value)}
                                                        className="h-12 sm:h-10 text-base sm:text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-base sm:text-sm">フランス語</Label>
                                                    <Input
                                                        value={editFrTerm}
                                                        onChange={(e) => setEditFrTerm(e.target.value)}
                                                        className="h-12 sm:h-10 text-base sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-base sm:text-sm">備考（任意）</Label>
                                                <Input
                                                    value={editNote}
                                                    onChange={(e) => setEditNote(e.target.value)}
                                                    className="h-12 sm:h-10 text-base sm:text-sm"
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button onClick={handleUpdateGlossaryTerm} className="flex-1 h-12 sm:h-10 text-base sm:text-sm">
                                                    <Save className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                                                    保存
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingTerm(null)
                                                        setEditJaTerm("")
                                                        setEditFrTerm("")
                                                        setEditNote("")
                                                    }}
                                                    className="h-12 sm:h-10 text-base sm:text-sm"
                                                >
                                                    キャンセル
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        glossaryTerms.map((term, index) => (
                                            <motion.div
                                                key={term.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15, delay: index * 0.05 }}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center space-x-4">
                                                        <div>
                                                            <span className="font-semibold text-base sm:text-lg text-balance">{term.ja_term}</span>
                                                            <span className="mx-2 text-muted-foreground">→</span>
                                                            <span className="font-semibold text-base sm:text-lg text-balance">{term.fr_term}</span>
                                                        </div>
                                                    </div>
                                                    {term.note && (
                                                        <p className="text-sm sm:text-base text-muted-foreground text-pretty">{term.note}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditGlossaryTerm(term)}
                                                        className="h-9 w-9"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteGlossaryTerm(term.id)}
                                                        className="h-9 w-9 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    )}

                    {/* Templates Tab */}
                    {activeTab === "templates" && (
                        <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl text-balance">テンプレート管理</CardTitle>
                                <CardDescription className="text-sm sm:text-base text-pretty">
                                    週次タスクテンプレートを管理します
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-base sm:text-sm text-muted-foreground text-pretty">
                                        テンプレート機能は今後実装予定です。
                                    </p>
                                    <Button
                                        onClick={async () => {
                                            const res = await fetch("/api/templates/init", { method: "POST" })
                                            if (res.ok) {
                                                alert("デフォルトテンプレートを初期化しました")
                                            }
                                        }}
                                        className="h-12 sm:h-10 text-base sm:text-sm"
                                    >
                                        デフォルトテンプレートを初期化
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    )}

                    {/* Schedule Tab */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl text-balance">営業日管理</CardTitle>
                                <CardDescription className="text-sm sm:text-base text-pretty">
                                    週ごとの営業日例外を設定します
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => window.location.href = "/settings/schedule"}
                                    className="h-12 sm:h-10 text-base sm:text-sm w-full"
                                >
                                    営業日管理画面を開く
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Tab */}
                    {activeTab === "users" && (
                        <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl text-balance">ユーザー管理</CardTitle>
                                <CardDescription className="text-sm sm:text-base text-pretty">
                                    ユーザー情報を表示します
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-base sm:text-sm text-muted-foreground text-pretty">
                                        ユーザー管理機能は今後実装予定です。
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    )}

                    {/* Recommendations Tab */}
                    {activeTab === "recommendations" && (
                        <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5" />
                                            改善提案
                                        </CardTitle>
                                        <CardDescription className="text-sm sm:text-base text-pretty mt-1">
                                            ログ分析から生成された改善提案
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={handleGenerateRecommendations}
                                        disabled={isLoadingRecommendations}
                                        className="h-10 text-sm"
                                    >
                                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                                        提案を生成
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingRecommendations ? (
                                    <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">
                                        読み込み中...
                                    </div>
                                ) : recommendations.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-base sm:text-sm text-pretty mb-4">提案がありません</p>
                                        <Button onClick={handleGenerateRecommendations} className="h-10 text-sm">
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            提案を生成
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recommendations.map((rec, index) => (
                                            <motion.div
                                                key={rec.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15, delay: index * 0.05 }}
                                                className="rounded-lg border p-4 bg-primary/5"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {rec.type === 'add_checklist_to_template' ? 'テンプレート追加' :
                                                                 rec.type === 'adjust_task_deadline' ? '期限調整' :
                                                                 rec.type === 'assign_to_maxime' ? '担当変更' : 'その他'}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="font-semibold text-base sm:text-lg text-balance">
                                                            {rec.payload_json?.title || '提案'}
                                                        </h4>
                                                        <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                                                            {rec.payload_json?.description || ''}
                                                        </p>
                                                        {rec.payload_json?.action && (
                                                            <p className="text-xs sm:text-sm text-muted-foreground text-pretty">
                                                                <strong>アクション:</strong> {rec.payload_json.action}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApproveRecommendation(rec.id)}
                                                            className="h-9 text-xs sm:text-sm"
                                                        >
                                                            <Check className="mr-1 h-4 w-4" />
                                                            承認
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRejectRecommendation(rec.id)}
                                                            className="h-9 text-xs sm:text-sm"
                                                        >
                                                            <XCircle className="mr-1 h-4 w-4" />
                                                            却下
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
