"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listUsers, createUser, deleteUser, resetPassword, type AdminUser } from "@/lib/admin";
import type { CurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, KeyRound, Trash2 } from "lucide-react";

export function UsersTable({ currentUser }: { currentUser: CurrentUser }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const { users } = await listUsers();
      setUsers(users);
    } catch (err) {
      console.error(err);
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(user: AdminUser) {
    if (user.id === currentUser.id) {
      toast.error("Kendi hesabını silemezsin.");
      return;
    }
    if (!window.confirm(`${user.username} kullanıcısını silmek istediğine emin misin?`)) return;

    try {
      await deleteUser(user.id);
      toast.success("Kullanıcı silindi.");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Kullanıcı silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateUserDialog onCreated={refresh} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı Adı</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border font-mono capitalize",
                        u.role === "admin"
                          ? "border-primary/35 bg-primary/15 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <ResetPasswordDialog user={u} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={u.id === currentUser.id}
                      onClick={() => handleDelete(u)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"admin" | "personel">("personel");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser({ email: email.trim(), password, username: username.trim(), role });
      toast.success("Kullanıcı oluşturuldu.");
      setOpen(false);
      setEmail("");
      setPassword("");
      setUsername("");
      setRole("personel");
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error("Kullanıcı oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Yeni Kullanıcı
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı</DialogTitle>
            <DialogDescription>Panel için bir hesap oluştur.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-username">Kullanıcı Adı</Label>
            <Input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-email">E-posta</Label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">Şifre</Label>
            <Input
              id="new-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "personel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personel">personel</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(user.id, password);
      toast.success("Şifre sıfırlandı.");
      setOpen(false);
      setPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Şifre sıfırlanamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon">
          <KeyRound className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Şifre Sıfırla</DialogTitle>
            <DialogDescription>{user.username} için yeni şifre belirle.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-password">Yeni Şifre</Label>
            <Input
              id="reset-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
